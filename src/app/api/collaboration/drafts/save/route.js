import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth.js';
import Draft from '../../../../../models/Draft.js';
import { getIO } from '../../../../../lib/socket.js';
import connectDB from '../../../../../lib/mongodb.js';

export async function POST(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, groupId, content, attachments, replyTo, deviceId } = body;

    const draft = await Draft.findOneAndUpdate(
      { user: user._id, chatId: chatId || null, groupId: groupId || null },
      {
        user: user._id,
        chatId: chatId || null,
        groupId: groupId || null,
        content: content || '',
        attachments: attachments || [],
        replyTo: replyTo || null,
        deviceId: deviceId || null,
        lastSavedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Emit socket event for cross-device sync
    const io = getIO();
    if (io) {
      io.to(`user:${user._id}`).emit('draft:update', {
        action: 'saved',
        draft,
      });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
  }
}

