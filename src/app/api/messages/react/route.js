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

    const { messageId, emoji } = await request.json();

    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'Message ID and emoji are required' }, { status: 400 });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: message.chatId,
      participants: user._id,
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if reaction already exists
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === user._id.toString() && r.emoji === emoji
    );

    if (existingReactionIndex !== -1) {
      // Remove reaction
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Remove other reactions from same user
      message.reactions = message.reactions.filter(
        (r) => r.userId.toString() !== user._id.toString()
      );
      // Add new reaction
      message.reactions.push({ emoji, userId: user._id });
    }

    await message.save();

    await message.populate('senderId', 'name email profilePhoto');

    // Emit socket event
    try {
      const io = getIO();
      io.to(`chat:${message.chatId}`).emit('reactionAdded', {
        messageId: message._id,
        reactions: message.reactions,
        chatId: message.chatId,
      });
    } catch (socketError) {
      console.error('Socket error:', socketError);
    }

    return NextResponse.json({
      message: 'Reaction updated successfully',
      reactions: message.reactions,
    });
  } catch (error) {
    console.error('React to message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
