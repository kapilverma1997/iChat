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

    const { messageId, priority } = await request.json();

    if (!messageId || !priority) {
      return NextResponse.json(
        { error: 'Message ID and priority are required' },
        { status: 400 }
      );
    }

    if (!['normal', 'important', 'urgent'].includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
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

    message.priority = priority;
    await message.save();

    await message.populate('senderId', 'name email profilePhoto');

    // Emit socket event
    try {
      const io = getIO();
      if (io) {
        io.to(`chat:${message.chatId}`).emit('message:priority', {
          messageId: message._id.toString(),
          priority,
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
    console.error('Update priority error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

