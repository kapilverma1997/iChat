import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';
import Message from '../../../../../models/Message.js';
import MessageLog from '../../../../../models/MessageLog.js';
import { getIO } from '../../../../../lib/socket.js';

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

    // Create message
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
      metadata: metadata || {},
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

    // Emit socket event
    try {
      const io = getIO();
      if (io) {
        const messageObj = message.toObject();
        // Ensure senderId is properly formatted
        if (messageObj.senderId && typeof messageObj.senderId === 'object') {
          messageObj.senderId = {
            _id: messageObj.senderId._id,
            name: messageObj.senderId.name,
            email: messageObj.senderId.email,
            profilePhoto: messageObj.senderId.profilePhoto,
          };
        }
        // Ensure quotedMessage senderId is properly formatted
        if (messageObj.quotedMessage && typeof messageObj.quotedMessage === 'object') {
          if (messageObj.quotedMessage.senderId && typeof messageObj.quotedMessage.senderId === 'object') {
            messageObj.quotedMessage.senderId = {
              _id: messageObj.quotedMessage.senderId._id,
              name: messageObj.quotedMessage.senderId.name,
              email: messageObj.quotedMessage.senderId.email,
              profilePhoto: messageObj.quotedMessage.senderId.profilePhoto,
            };
          }
        }
        // Emit both old and new event names for compatibility
        io.to(`chat:${chatId}`).emit('receiveMessage', {
          message: messageObj,
          chatId: chatId.toString(),
        });
        io.to(`chat:${chatId}`).emit('message:new', {
          message: messageObj,
          chatId: chatId.toString(),
        });
        if (quotedMessage) {
          io.to(`chat:${chatId}`).emit('message:quote', {
            messageId: message._id.toString(),
            quotedMessageId: quotedMessage,
            chatId: chatId.toString(),
          });
        }
        console.log(`Emitted message to chat:${chatId}`);
      } else {
        console.warn('Socket.io not available, message saved but not broadcasted');
      }
    } catch (socketError) {
      console.error('Socket error:', socketError);
      // Don't fail the request if socket fails
    }

    return NextResponse.json({
      success: true,
      message: message.toObject(),
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
