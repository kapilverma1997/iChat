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

    const { messageId, tags } = await request.json();

    if (!messageId || !Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Message ID and tags array are required' },
        { status: 400 }
      );
    }

    // Validate tags
    const validTags = ['important', 'todo', 'reminder'];
    const invalidTags = tags.filter((tag) => !validTags.includes(tag));
    if (invalidTags.length > 0) {
      return NextResponse.json(
        { error: `Invalid tags: ${invalidTags.join(', ')}` },
        { status: 400 }
      );
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

    message.tags = tags;
    await message.save();

    await message.populate('senderId', 'name email profilePhoto');

    // Emit socket event
    try {
      const io = getIO();
      if (io) {
        io.to(`chat:${message.chatId}`).emit('message:tags', {
          messageId: message._id.toString(),
          tags,
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
    console.error('Update tags error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

