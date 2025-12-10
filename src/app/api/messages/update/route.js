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

    const { messageId, content, isStarred, isPinned } = await request.json();

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify user is sender or participant
    const chat = await Chat.findOne({
      _id: message.chatId,
      participants: user._id,
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Update fields
    if (content !== undefined && message.senderId.toString() === user._id.toString()) {
      message.content = content;
    }
    if (isStarred !== undefined) message.isStarred = isStarred;
    if (isPinned !== undefined) message.isPinned = isPinned;

    await message.save();

    await message.populate('senderId', 'name email profilePhoto');
    if (message.replyTo) {
      await message.populate('replyTo');
    }

    // Emit socket event
    try {
      const io = getIO();
      io.to(`chat:${message.chatId}`).emit('messageUpdated', {
        message: message.toObject(),
        chatId: message.chatId,
      });
    } catch (socketError) {
      console.error('Socket error:', socketError);
    }

    return NextResponse.json({
      message: 'Message updated successfully',
      message: message.toObject(),
    });
  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
