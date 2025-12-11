import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth.js';
import Draft from '../../../../../models/Draft.js';
import { getIO } from '../../../../../lib/socket.js';
import connectDB from '../../../../../lib/mongodb.js';

export async function DELETE(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const groupId = searchParams.get('groupId');

    await Draft.findOneAndDelete({
      user: user._id,
      chatId: chatId || null,
      groupId: groupId || null,
    });

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`user:${user._id}`).emit('draft:update', {
        action: 'deleted',
        chatId,
        groupId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
  }
}

