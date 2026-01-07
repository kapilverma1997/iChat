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
import GroupMessage from '../models/GroupMessage.js';
import Reminder from '../models/Reminder.js';
import FileModel from '../models/File.js';
import Chat from '../models/Chat.js';
import Group from '../models/Group.js';
import MessageRetention from '../models/MessageRetention.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AdminSettings from '../models/AdminSettings.js';
import ArchivedChat from '../models/ArchivedChat.js';
import MessageBackup from '../models/MessageBackup.js';
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

    // console.log(`Processed ${scheduledMessages.length} scheduled messages`);
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

    // console.log(`Expired ${expiredMessages.length} messages`);
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

    // console.log(`Deleted ${expiredFiles.length} expired files`);
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

    // console.log(`Processed ${reminders.length} reminders`);
  } catch (error) {
    // console.error('Error processing reminders:', error);
  }
}

// Process message retention policies
export async function processMessageRetention() {
  try {
    await connectDB();

    const now = new Date();
    const retentionPolicies = await MessageRetention.find({
      isActive: true,
      nextPurgeAt: { $lte: now },
      retentionPeriod: { $ne: 'forever' },
    })
      .populate('chatId')
      .populate('groupId');

    for (const policy of retentionPolicies) {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (policy.retentionDays || 0));

        let deletedCount = 0;

        if (policy.chatId) {
          // Delete old messages from chat
          const result = await Message.deleteMany({
            chatId: policy.chatId._id,
            createdAt: { $lt: cutoffDate },
            isDeleted: false,
          });
          deletedCount = result.deletedCount;

          // Emit socket event
          const io = getIO();
          if (io && deletedCount > 0) {
            io.to(`chat:${policy.chatId._id}`).emit('message:deletedByPolicy', {
              chatId: policy.chatId._id.toString(),
              count: deletedCount,
            });
          }
        } else if (policy.groupId) {
          // Delete old messages from group
          const result = await GroupMessage.deleteMany({
            groupId: policy.groupId._id,
            createdAt: { $lt: cutoffDate },
            isDeleted: false,
          });
          deletedCount = result.deletedCount;

          // Emit socket event
          const io = getIO();
          if (io && deletedCount > 0) {
            io.to(`group:${policy.groupId._id}`).emit('message:deletedByPolicy', {
              groupId: policy.groupId._id.toString(),
              count: deletedCount,
            });
          }
        }

        // Update next purge date
        if (policy.retentionDays) {
          policy.nextPurgeAt = new Date();
          policy.nextPurgeAt.setDate(policy.nextPurgeAt.getDate() + policy.retentionDays);
          policy.lastPurgedAt = new Date();
          await policy.save();
        }

        console.log(`Purged ${deletedCount} messages for retention policy ${policy._id}`);
      } catch (error) {
        console.error(`Error processing retention policy ${policy._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing message retention:', error);
  }
}

// Send email digests to users
export async function processEmailDigests() {
  try {
    await connectDB();

    // Find users with email notifications enabled (check notificationSettings.emailNotifications first)
    const allUsers = await User.find({
      'notificationPreferences.emailDigestInterval': { $exists: true },
    });

    // Filter users who have email notifications enabled
    const users = allUsers.filter(user => {
      return user.notificationSettings?.emailNotifications ?? user.notificationPreferences?.emailEnabled ?? false;
    });

    for (const user of users) {
      try {
        const interval = user.notificationPreferences.emailDigestInterval || 60;
        const since = new Date(Date.now() - interval * 60 * 1000);

        // Get unread notifications since last digest
        const unreadNotifications = await Notification.find({
          userId: user._id,
          isRead: false,
          createdAt: { $gte: since },
          isEmailed: false,
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();

        if (unreadNotifications.length > 0) {
          // Import email function
          const { sendEmail } = await import('../lib/email.js');

          // Group notifications by type
          const grouped = {};
          unreadNotifications.forEach((notif) => {
            if (!grouped[notif.type]) {
              grouped[notif.type] = [];
            }
            grouped[notif.type].push(notif);
          });

          // Build email content
          let emailBody = `
            <h2>You have ${unreadNotifications.length} missed notifications</h2>
            <ul>
          `;

          Object.keys(grouped).forEach((type) => {
            emailBody += `<li><strong>${type}:</strong> ${grouped[type].length} notifications</li>`;
          });

          emailBody += `</ul><p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chats">View in iChat</a></p>`;

          await sendEmail({
            to: user.email,
            subject: `iChat: ${unreadNotifications.length} Missed Notifications`,
            html: emailBody,
            text: `You have ${unreadNotifications.length} missed notifications. Visit iChat to view them.`,
          });

          // Mark notifications as emailed
          await Notification.updateMany(
            {
              _id: { $in: unreadNotifications.map((n) => n._id) },
            },
            { isEmailed: true }
          );

          console.log(`Sent email digest to ${user.email} with ${unreadNotifications.length} notifications`);
        }
      } catch (error) {
        console.error(`Error sending email digest to ${user.email}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing email digests:', error);
  }
}

// Auto-archive inactive chats (admin settings - keep for backward compatibility)
export async function processAutoArchive() {
  try {
    await connectDB();

    const settings = await AdminSettings.findOne();
    const archiveDays = settings?.autoArchiveDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - archiveDays);

    // Find inactive chats (no messages in last X days)
    const inactiveChats = await Chat.find({
      lastMessageAt: { $lt: cutoffDate },
      isArchived: false,
    })
      .populate('participants')
      .lean();

    for (const chat of inactiveChats) {
      try {
        // Check if already archived
        const existingArchive = await ArchivedChat.findOne({ chatId: chat._id });
        if (existingArchive) continue;

        // Create archive record
        await ArchivedChat.create({
          chatId: chat._id,
          archivedAt: new Date(),
          archivedBy: chat.participants[0]?._id || null,
          reason: 'Inactive',
          lastActivityAt: chat.lastMessageAt || chat.createdAt,
          canRestore: true,
        });

        // Mark chat as archived
        await Chat.findByIdAndUpdate(chat._id, {
          isArchived: true,
        });

        console.log(`Archived chat: ${chat._id}`);
      } catch (error) {
        console.error(`Error archiving chat ${chat._id}:`, error);
      }
    }

    // console.log(`Archived ${inactiveChats.length} inactive chats`);
  } catch (error) {
    console.error('Error processing auto-archive:', error);
  }
}

// Process user-specific auto-delete messages
export async function processUserAutoDelete() {
  try {
    await connectDB();

    // Find users with auto-delete enabled
    const users = await User.find({
      'messageHistorySettings.autoDeleteEnabled': true,
      'messageHistorySettings.autoDeleteDays': { $exists: true, $gt: 0 },
    });

    for (const user of users) {
      try {
        const autoDeleteDays = user.messageHistorySettings?.autoDeleteDays || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - autoDeleteDays);

        // Find all chats where user is a participant
        const userChats = await Chat.find({
          participants: user._id,
        }).select('_id');

        const chatIds = userChats.map((chat) => chat._id);

        if (chatIds.length === 0) continue;

        // Delete old messages from user's chats
        const result = await Message.updateMany(
          {
            chatId: { $in: chatIds },
            createdAt: { $lt: cutoffDate },
            isDeleted: false,
            senderId: user._id, // Only delete messages sent by this user
          },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date(),
            },
          }
        );

        if (result.modifiedCount > 0) {
          // Emit socket events for affected chats
          const io = getIO();
          if (io) {
            const affectedChats = await Message.distinct('chatId', {
              chatId: { $in: chatIds },
              createdAt: { $lt: cutoffDate },
              senderId: user._id,
            });

            affectedChats.forEach((chatId) => {
              io.to(`chat:${chatId}`).emit('message:deletedByAutoDelete', {
                chatId: chatId.toString(),
                userId: user._id.toString(),
                count: result.modifiedCount,
              });
            });
          }

          console.log(`Auto-deleted ${result.modifiedCount} messages for user ${user._id}`);
        }
      } catch (error) {
        console.error(`Error processing auto-delete for user ${user._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing user auto-delete:', error);
  }
}

// Process user-specific auto-archive chats
export async function processUserAutoArchive() {
  try {
    await connectDB();

    // Find users with auto-archive enabled
    const users = await User.find({
      'messageHistorySettings.archiveOldChats': true,
      'messageHistorySettings.archiveAfterDays': { $exists: true, $gt: 0 },
    });

    for (const user of users) {
      try {
        const archiveAfterDays = user.messageHistorySettings?.archiveAfterDays || 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - archiveAfterDays);

        // Find inactive chats for this user (no messages in last X days)
        const inactiveChats = await Chat.find({
          participants: user._id,
          lastMessageAt: { $lt: cutoffDate },
          isArchived: false,
        })
          .populate('participants')
          .lean();

        for (const chat of inactiveChats) {
          try {
            // Check if already archived
            const existingArchive = await ArchivedChat.findOne({ chatId: chat._id });
            if (existingArchive) continue;

            // Create archive record
            await ArchivedChat.create({
              chatId: chat._id,
              archivedAt: new Date(),
              archivedBy: user._id,
              reason: 'Auto-archived by user settings',
              lastActivityAt: chat.lastMessageAt || chat.createdAt,
              canRestore: true,
            });

            // Mark chat as archived
            await Chat.findByIdAndUpdate(chat._id, {
              isArchived: true,
            });

            // Emit socket event
            const io = getIO();
            if (io) {
              io.to(`user:${user._id}`).emit('chat:archived', {
                chatId: chat._id.toString(),
                reason: 'Auto-archived due to inactivity',
              });
            }

            console.log(`Auto-archived chat ${chat._id} for user ${user._id}`);
          } catch (error) {
            console.error(`Error archiving chat ${chat._id} for user ${user._id}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing auto-archive for user ${user._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing user auto-archive:', error);
  }
}

// Process message backups for users with backup enabled
export async function processMessageBackups() {
  try {
    await connectDB();

    // Find users with backup enabled
    const users = await User.find({
      'messageHistorySettings.backupEnabled': true,
    });

    for (const user of users) {
      try {
        // Check if backup was done recently (within last 24 hours)
        const lastBackup = await MessageBackup.findOne({
          userId: user._id,
          status: 'completed',
          backupDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }).sort({ backupDate: -1 });

        // Skip if backup was done in last 24 hours
        if (lastBackup) {
          continue;
        }

        // Find all chats where user is a participant
        const userChats = await Chat.find({
          participants: user._id,
        }).select('_id');

        if (userChats.length === 0) continue;

        let totalMessagesBackedUp = 0;
        const backupDate = new Date();

        // Process each chat separately to avoid memory issues
        for (const chat of userChats) {
          try {
            // Get all non-deleted messages from this chat
            const messages = await Message.find({
              chatId: chat._id,
              isDeleted: false,
            })
              .sort({ createdAt: -1 })
              .lean();

            if (messages.length === 0) continue;

            // Prepare messages for backup
            const chatMessages = messages.map((message) => ({
              messageId: message._id,
              messageData: message,
              backedUpAt: backupDate,
            }));

            // Calculate backup size (approximate)
            const backupSize = JSON.stringify(chatMessages).length;

            // Create backup record for this chat
            await MessageBackup.create({
              userId: user._id,
              chatId: chat._id,
              messages: chatMessages,
              backupType: 'scheduled',
              backupDate: backupDate,
              size: backupSize,
              messageCount: chatMessages.length,
              status: 'completed',
            });

            totalMessagesBackedUp += chatMessages.length;
          } catch (error) {
            console.error(`Error creating backup for chat ${chat._id} for user ${user._id}:`, error);
          }
        }

        if (totalMessagesBackedUp > 0) {
          console.log(`Created backup for user ${user._id} with ${totalMessagesBackedUp} messages across ${userChats.length} chats`);
        }
      } catch (error) {
        console.error(`Error processing backup for user ${user._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing message backups:', error);
  }
}

// Run all cron jobs
export async function runCronJobs() {
  await processScheduledMessages();
  await processMessageExpiration();
  await processFileExpiration();
  await processReminders();
  await processMessageRetention();
  await processEmailDigests();
  await processAutoArchive();
  await processUserAutoDelete();
  await processUserAutoArchive();
  await processMessageBackups();
}

// Schedule cron jobs to run every minute
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    runCronJobs().catch(console.error);
  }, 60000); // Run every minute

  // Run immediately on startup
  runCronJobs().catch(console.error);
}

