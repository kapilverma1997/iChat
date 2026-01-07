import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Message from '../../../../../models/Message.js';
import Chat from '../../../../../models/Chat.js';
import { publishReadReceipt } from '../../../../../lib/messageProducer.js';

/**
 * Mark a message as read
 * POST /api/messages/read
 */
export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, chatId } = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
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

    // Get message
    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify message belongs to this chat
    if (message.chatId.toString() !== chatId) {
      return NextResponse.json(
        { error: 'Message does not belong to this chat' },
        { status: 400 }
      );
    }

    // Check if already read by this user
    const alreadyRead = message.readBy.some(
      (r) => r.userId.toString() === user._id.toString()
    );

    if (!alreadyRead) {
      // Update message read status immediately
      message.readBy.push({
        userId: user._id,
        readAt: new Date(),
      });
      await message.save();

      // Publish read receipt to RabbitMQ for async processing
      // This ensures read receipts are processed even if this API call fails
      try {
        await publishReadReceipt({
          messageId: message._id,
          chatId: chatId,
          userId: user._id,
          readAt: new Date(),
        });
      } catch (rabbitmqError) {
        console.error('Error publishing read receipt to RabbitMQ:', rabbitmqError);
        // Continue even if RabbitMQ fails - message is already updated in DB
      }
    }

    // Determine read status (single tick = delivered, double tick = read)
    const isRead = message.readBy.length > 0;
    const isReadByRecipient = message.readBy.some(
      (r) => r.userId.toString() !== message.senderId.toString()
    );

    return NextResponse.json({
      success: true,
      message: {
        messageId: message._id,
        readBy: message.readBy,
        isRead,
        isReadByRecipient,
      },
    });
  } catch (error) {
    console.error('Mark message read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Mark all messages in a chat as read
 * POST /api/messages/read-all
 */
export async function PATCH(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await request.json();

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
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

    // Mark all unread messages as read
    const result = await Message.updateMany(
      {
        chatId,
        senderId: { $ne: user._id },
        'readBy.userId': { $ne: user._id },
        isDeleted: false,
      },
      {
        $push: {
          readBy: {
            userId: user._id,
            readAt: new Date(),
          },
        },
      }
    );

    // Publish read receipts for all marked messages
    // Get the messages that were just marked as read
    const messages = await Message.find({
      chatId,
      senderId: { $ne: user._id },
      'readBy.userId': user._id,
      isDeleted: false,
    }).select('_id');

    // Publish read receipts (async, don't wait)
    messages.forEach((msg) => {
      publishReadReceipt({
        messageId: msg._id,
        chatId: chatId,
        userId: user._id,
        readAt: new Date(),
      }).catch((err) => {
        console.error(`Error publishing read receipt for ${msg._id}:`, err);
      });
    });

    return NextResponse.json({
      success: true,
      markedAsRead: result.modifiedCount,
    });
  } catch (error) {
    console.error('Mark all messages read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

