import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';
import Message from '../../../../../models/Message.js';
import { getIO } from '../../../../../lib/socket.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageIds, chatId } = await request.json();

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: 'Message IDs array is required' },
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

    // Mark messages as read (only messages not sent by the current user)
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
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
    if (result.modifiedCount > 0) {
      try {
        const io = getIO();
        if (io) {
          // Get the messages that were just marked as read with full details
          const readMessages = await Message.find({
            _id: { $in: messageIds },
            chatId,
            senderId: { $ne: user._id },
            'readBy.userId': user._id,
            isDeleted: false,
          })
            .populate('senderId', 'name email profilePhoto')
            .populate('replyTo')
            .populate({
              path: 'quotedMessage',
              populate: {
                path: 'senderId',
                select: 'name email profilePhoto'
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

      // Reset unread count for this user
      chat.unreadCount.set(user._id.toString(), 0);
      await chat.save();
    }

    // Get updated messages with readBy information
    const updatedMessages = await Message.find({
      _id: { $in: messageIds },
      chatId,
    })
      .populate('senderId', 'name email profilePhoto')
      .populate('replyTo')
      .populate({
        path: 'quotedMessage',
        populate: {
          path: 'senderId',
          select: 'name email profilePhoto'
        }
      })
      .lean();

    return NextResponse.json({
      success: true,
      messages: updatedMessages,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

