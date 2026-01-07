import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';
import Message from '../../../../../models/Message.js';
import MessageLog from '../../../../../models/MessageLog.js';
import User from '../../../../../models/User.js';
import { getIO } from '../../../../../lib/socket.js';
import { notifyNewMessage } from '../../../../../lib/notifications.js';
import { publishMessage } from '../../../../../lib/messageProducer.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      chatId,
      content,
      type = 'text',
      fileUrl,
      fileName,
      fileSize,
      replyTo,
      quotedMessage,
      priority = 'normal',
      tags = [],
      metadata,
    } = await request.json();

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    // Allow empty content for certain message types (emoji, location, contact)
    if (!content && !['emoji', 'location', 'contact'].includes(type)) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: user._id,
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Fetch full user data to check watermark settings
    const fullUser = await User.findById(user._id).select('email chatSecurity');
    const watermarkEnabled = fullUser?.chatSecurity?.watermarkEnabled || false;

    // Prepare metadata with watermark if enabled
    let messageMetadata = metadata || {};
    if (watermarkEnabled) {
      const timestamp = new Date().toISOString();
      messageMetadata = {
        ...messageMetadata,
        watermark: {
          email: fullUser.email,
          userId: user._id.toString(),
          timestamp: timestamp,
        },
      };
    }

    // Create message in MongoDB first (for immediate response)
    const message = await Message.create({
      chatId,
      senderId: user._id,
      content: content || '',
      type,
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      replyTo: replyTo || null,
      quotedMessage: quotedMessage || null,
      priority,
      tags,
      metadata: messageMetadata,
      deliveredAt: new Date(),
    });

    // Update chat
    chat.messages.push(message._id);
    chat.lastMessage = message._id;
    chat.lastMessageAt = new Date();

    // Increment unread count for other participants
    chat.participants.forEach((participantId) => {
      if (participantId.toString() !== user._id.toString()) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await chat.save();

    // Log message for admin tracking
    try {
      await MessageLog.create({
        messageId: message._id,
        senderId: user._id,
        chatId: chatId,
        content: content || '',
        type: type,
        fileUrl: fileUrl || '',
        fileName: fileName || '',
      });
    } catch (logError) {
      console.error('Error creating message log:', logError);
      // Don't fail the request if logging fails
    }

    // Populate message with sender info
    await message.populate('senderId', 'name email profilePhoto');
    if (message.replyTo) {
      await message.populate('replyTo');
    }
    if (message.quotedMessage) {
      await message.populate({
        path: 'quotedMessage',
        populate: {
          path: 'senderId',
          select: 'name email profilePhoto'
        }
      });
    }

    // Prepare message object for Socket.IO and RabbitMQ
    const messageObj = message.toObject();
    // Format sender info for Socket.IO
    if (messageObj.senderId && typeof messageObj.senderId === 'object') {
      messageObj.senderId = {
        _id: messageObj.senderId._id,
        name: messageObj.senderId.name,
        email: messageObj.senderId.email,
        profilePhoto: messageObj.senderId.profilePhoto,
      };
    }

    // IMMEDIATELY emit via Socket.IO for real-time delivery to online users
    // This ensures instant message delivery regardless of RabbitMQ status
    try {
      const io = getIO();
      if (io) {
        // Emit to chat room (for all participants in the chat)
        io.to(`chat:${chatId}`).emit('receiveMessage', {
          message: messageObj,
          chatId: chatId.toString(),
        });
        io.to(`chat:${chatId}`).emit('message:new', {
          message: messageObj,
          chatId: chatId.toString(),
        });

        // Emit to user-specific rooms (for targeted delivery)
        chat.participants.forEach((participantId) => {
          if (participantId.toString() !== user._id.toString()) {
            io.to(`user:${participantId.toString()}`).emit('message:new', {
              message: messageObj,
              chatId: chatId.toString(),
            });
            io.to(`user:${participantId.toString()}`).emit('receiveMessage', {
              message: messageObj,
              chatId: chatId.toString(),
            });
          }
        });
        console.log(`✅ Emitted message ${message._id} via Socket.IO for real-time delivery`);
      }
    } catch (socketError) {
      console.error('Error emitting message via Socket.IO:', socketError);
      // Continue even if Socket.IO fails - RabbitMQ consumer will handle delivery
    }

    // ALSO publish message to RabbitMQ for async processing
    // This handles:
    // 1. Offline message queuing (for users not currently online)
    // 2. Analytics and logging
    // 3. Backup delivery mechanism
    // 4. Distributed system support (multiple server instances)
    try {
      await publishMessage({
        ...messageObj,
        participants: chat.participants.map((p) => p.toString()),
      });
      console.log(`📤 Published message ${message._id} to RabbitMQ for async processing`);
    } catch (rabbitmqError) {
      console.error('Error publishing to RabbitMQ:', rabbitmqError);
      // Don't fail the request - Socket.IO already delivered the message
      // RabbitMQ is for async processing, not critical for real-time delivery
    }

    // Send push notifications to all participants (except sender)
    // This ensures users receive push notifications even when they're offline or not actively viewing the chat
    const senderName = messageObj.senderId?.name || user.name || 'Someone';
    const messageContent = content || (type === 'file' ? fileName : type === 'image' ? 'sent an image' : type === 'video' ? 'sent a video' : 'sent a message');

    const notificationPromises = chat.participants
      .filter((participantId) => participantId.toString() !== user._id.toString())
      .map(async (participantId) => {
        try {
          console.log('notifyNewMessage', participantId.toString(), senderName, messageContent, chatId.toString(), message._id.toString(), false);
          await notifyNewMessage({
            userId: participantId.toString(),
            senderName,
            messageContent: typeof messageContent === 'string' ? messageContent : String(messageContent),
            chatId: chatId.toString(),
            messageId: message._id.toString(),
            isMention: false,
          });
        } catch (notifError) {
          console.error(`Error sending push notification to user ${participantId}:`, notifError);
          // Don't fail the request if notification fails
        }
      });

    // Wait for all notifications to complete (in parallel, but don't block response)
    Promise.allSettled(notificationPromises).catch((error) => {
      console.error('Error in notification promises:', error);
    });

    return NextResponse.json({
      success: true,
      message: message.toObject(),
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
