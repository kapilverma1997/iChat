import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';
import Message from '../../../../../models/Message.js';
import { getIO } from '../../../../../lib/socket.js';

export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: user._id,
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Get messages - exclude messages deleted for this user
    const messages = await Message.find({
      chatId,
      isDeleted: false,
      $or: [
        { deletedFor: { $exists: false } },
        { deletedFor: { $size: 0 } },
        { deletedFor: { $nin: [user._id] } },
      ],
    })
      .populate('senderId', 'name email profilePhoto privacySettings')
      .populate('replyTo')
      .populate({
        path: 'quotedMessage',
        populate: {
          path: 'senderId',
          select: 'name email profilePhoto privacySettings'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    // Mark messages as read (when user opens chat)
    // Import read receipt publisher
    const { publishReadReceipt } = await import('../../../../../lib/messageProducer.js');
    
    const unreadMessages = await Message.updateMany(
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

    // If messages were marked as read, notify the sender(s) via socket
    if (unreadMessages.modifiedCount > 0) {
      try {
        const io = getIO();
        if (io) {
          // Get the messages that were just marked as read with full details
          const readMessages = await Message.find({
            chatId,
            senderId: { $ne: user._id },
            'readBy.userId': user._id,
            isDeleted: false,
          })
            .populate('senderId', 'name email profilePhoto privacySettings')
            .populate('replyTo')
            .populate({
              path: 'quotedMessage',
              populate: {
                path: 'senderId',
                select: 'name email profilePhoto privacySettings'
              }
            })
            .lean();

          // Emit updated messages to the chat room so both users see read receipts in real-time
          io.to(`chat:${chatId}`).emit('messages:readReceipts', {
            chatId: chatId.toString(),
            messages: readMessages,
            readBy: user._id.toString(),
          });

          // Also emit to individual sender rooms for backward compatibility
          const senderIds = [...new Set(readMessages.map(msg => msg.senderId?._id?.toString() || msg.senderId?.toString()).filter(Boolean))];
          senderIds.forEach((senderId) => {
            io.to(`user:${senderId}`).emit('messages:read', {
              chatId: chatId.toString(),
              readBy: user._id.toString(),
              messages: readMessages.filter(msg => {
                const msgSenderId = msg.senderId?._id?.toString() || msg.senderId?.toString();
                return msgSenderId === senderId;
              }),
            });
          });
        }
      } catch (socketError) {
        console.error('Socket error when emitting read receipts:', socketError);
        // Don't fail the request if socket fails
      }
    }

    // Reset unread count
    chat.unreadCount.set(user._id.toString(), 0);
    await chat.save();

    return NextResponse.json({
      messages: messages.reverse(),
      page,
      limit,
      total: messages.length,
    });
  } catch (error) {
    console.error('List messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
