import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

import connectDB from '../lib/mongodb.js';
import ScheduledMessage from '../models/ScheduledMessage.js';
import Message from '../models/Message.js';
import Reminder from '../models/Reminder.js';
import FileModel from '../models/File.js';
import Chat from '../models/Chat.js';
import Group from '../models/Group.js';
import { getIO } from '../lib/socket.js';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

// Process scheduled messages
export async function processScheduledMessages() {
  try {
    await connectDB();

    const now = new Date();
    const scheduledMessages = await ScheduledMessage.find({
      sendAt: { $lte: now },
      isSent: false,
    })
      .populate('senderId', 'name email')
      .populate('targetChat')
      .populate('targetGroup');

    for (const scheduled of scheduledMessages) {
      try {
        const { message } = scheduled;
        let targetChat = scheduled.targetChat;
        let targetGroup = scheduled.targetGroup;

        // Verify chat/group still exists and user has access
        if (targetChat) {
          const chat = await Chat.findOne({
            _id: targetChat._id,
            participants: scheduled.senderId._id,
          });

          if (!chat) {
            scheduled.error = 'Chat no longer accessible';
            scheduled.isSent = true;
            scheduled.sentAt = new Date();
            await scheduled.save();
            continue;
          }

          // Create message
          const newMessage = await Message.create({
            chatId: chat._id,
            senderId: scheduled.senderId._id,
            content: message.content,
            type: message.type,
            fileUrl: message.fileUrl || '',
            fileName: message.fileName || '',
            fileSize: message.fileSize || 0,
            metadata: message.metadata || {},
            priority: message.priority || 'normal',
            tags: message.tags || [],
            scheduledAt: scheduled.sendAt,
            deliveredAt: new Date(),
          });

          // Update chat
          chat.messages.push(newMessage._id);
          chat.lastMessage = newMessage._id;
          chat.lastMessageAt = new Date();
          chat.participants.forEach((participantId) => {
            if (participantId.toString() !== scheduled.senderId._id.toString()) {
              const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
              chat.unreadCount.set(participantId.toString(), currentCount + 1);
            }
          });
          await chat.save();

          await newMessage.populate('senderId', 'name email profilePhoto');

          // Emit socket event
          const io = getIO();
          if (io) {
            io.to(`chat:${chat._id}`).emit('message:new', {
              message: newMessage.toObject(),
              chatId: chat._id.toString(),
            });
          }

          scheduled.isSent = true;
          scheduled.sentAt = new Date();
          await scheduled.save();
        } else if (targetGroup) {
          // Similar logic for groups
          const group = await Group.findOne({
            _id: targetGroup._id,
            members: { $elemMatch: { userId: scheduled.senderId._id } },
          });

          if (!group) {
            scheduled.error = 'Group no longer accessible';
            scheduled.isSent = true;
            scheduled.sentAt = new Date();
            await scheduled.save();
            continue;
          }

          // Import GroupMessage model
          const GroupMessage = (await import('../models/GroupMessage.js')).default;

          const newMessage = await GroupMessage.create({
            groupId: group._id,
            senderId: scheduled.senderId._id,
            content: message.content,
            type: message.type,
            fileUrl: message.fileUrl || '',
            fileName: message.fileName || '',
            fileSize: message.fileSize || 0,
            metadata: message.metadata || {},
            deliveredAt: new Date(),
          });

          scheduled.isSent = true;
          scheduled.sentAt = new Date();
          await scheduled.save();

          // Emit socket event for group
          const io = getIO();
          if (io) {
            io.to(`group:${group._id}`).emit('group:message', {
              message: newMessage.toObject(),
              groupId: group._id.toString(),
            });
          }
        }
      } catch (error) {
        console.error(`Error processing scheduled message ${scheduled._id}:`, error);
        scheduled.error = error.message;
        scheduled.isSent = true;
        scheduled.sentAt = new Date();
        await scheduled.save();
      }
    }

    console.log(`Processed ${scheduledMessages.length} scheduled messages`);
  } catch (error) {
    console.error('Error processing scheduled messages:', error);
  }
}

// Process message expiration
export async function processMessageExpiration() {
  try {
    await connectDB();

    const now = new Date();
    const expiredMessages = await Message.find({
      expiresAt: { $lte: now },
      isDeleted: false,
    });

    for (const message of expiredMessages) {
      message.isDeleted = true;
      message.deletedAt = new Date();
      message.content = 'This message has expired';
      message.fileUrl = '';
      message.fileName = '';
      await message.save();

      // Emit socket event
      const io = getIO();
      if (io) {
        io.to(`chat:${message.chatId}`).emit('message:expired', {
          messageId: message._id.toString(),
          chatId: message.chatId.toString(),
        });
      }
    }

    console.log(`Expired ${expiredMessages.length} messages`);
  } catch (error) {
    console.error('Error processing message expiration:', error);
  }
}

// Process file expiration
export async function processFileExpiration() {
  try {
    await connectDB();

    const now = new Date();
    const expiredFiles = await FileModel.find({
      expiresAt: { $lte: now },
    });

    for (const file of expiredFiles) {
      // Delete physical file
      try {
        const filePath = join(process.cwd(), 'public', file.url);
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
        if (file.thumbnail) {
          const thumbPath = join(process.cwd(), 'public', file.thumbnail);
          if (existsSync(thumbPath)) {
            await unlink(thumbPath);
          }
        }
      } catch (fileError) {
        console.error(`Error deleting file ${file._id}:`, fileError);
      }

      // Emit socket event
      const io = getIO();
      if (io) {
        if (file.chatId) {
          io.to(`chat:${file.chatId}`).emit('file:deleted', {
            fileId: file._id.toString(),
            chatId: file.chatId.toString(),
          });
        } else if (file.groupId) {
          io.to(`group:${file.groupId}`).emit('file:deleted', {
            fileId: file._id.toString(),
            groupId: file.groupId.toString(),
          });
        }
      }

      // Delete file record
      await FileModel.findByIdAndDelete(file._id);
    }

    console.log(`Deleted ${expiredFiles.length} expired files`);
  } catch (error) {
    console.error('Error processing file expiration:', error);
  }
}

// Process reminders
export async function processReminders() {
  try {
    await connectDB();

    const now = new Date();
    const reminders = await Reminder.find({
      remindAt: { $lte: now },
      isCompleted: false,
    })
      .populate('userId', 'name email')
      .populate('messageId');

    for (const reminder of reminders) {
      // Emit notification event (you can extend this to send push notifications, emails, etc.)
      const io = getIO();
      if (io) {
        io.to(`user:${reminder.userId._id}`).emit('reminder:due', {
          reminderId: reminder._id.toString(),
          messageId: reminder.messageId._id.toString(),
          message: reminder.messageId.toObject(),
        });
      }

      // Mark as completed (or you can keep it active until user dismisses)
      // reminder.isCompleted = true;
      // reminder.completedAt = new Date();
      // await reminder.save();
    }

    console.log(`Processed ${reminders.length} reminders`);
  } catch (error) {
    console.error('Error processing reminders:', error);
  }
}

// Run all cron jobs
export async function runCronJobs() {
  await processScheduledMessages();
  await processMessageExpiration();
  await processFileExpiration();
  await processReminders();
}

// Schedule cron jobs to run every minute
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    runCronJobs().catch(console.error);
  }, 60000); // Run every minute

  // Run immediately on startup
  runCronJobs().catch(console.error);
}

