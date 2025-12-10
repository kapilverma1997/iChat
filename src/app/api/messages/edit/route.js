import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';
import Message from '../../../../../models/Message.js';
import { getIO } from '../../../../../lib/socket.js';

export async function PATCH(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, content } = await request.json();

    if (!messageId || !content) {
      return NextResponse.json(
        { error: 'Message ID and content are required' },
        { status: 400 }
      );
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify user is sender
    if (message.senderId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized to edit this message' },
        { status: 403 }
      );
    }

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: message.chatId,
      participants: user._id,
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Update message
    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('senderId', 'name email profilePhoto');
    if (message.replyTo) {
      await message.populate('replyTo');
    }
    if (message.quotedMessage) {
      await message.populate('quotedMessage');
    }

    // Emit socket event
    try {
      const io = getIO();
      if (io) {
        io.to(`chat:${message.chatId}`).emit('message:edit', {
          message: message.toObject(),
          chatId: message.chatId.toString(),
        });
      }
    } catch (socketError) {
      console.error('Socket error:', socketError);
    }

    return NextResponse.json({
      success: true,
      message: message.toObject(),
    });
  } catch (error) {
    console.error('Edit message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

