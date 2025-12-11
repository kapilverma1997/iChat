import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth.js';
import Whiteboard from '../../../../../models/Whiteboard.js';
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
    const { title, chatId, groupId, settings } = body;

    const whiteboard = new Whiteboard({
      title: title || 'Untitled Whiteboard',
      chatId: chatId || null,
      groupId: groupId || null,
      createdBy: user._id,
      canvasData: '{}',
      settings: settings || {
        backgroundColor: '#ffffff',
        gridEnabled: false,
        snapToGrid: false,
      },
      collaborators: [{
        user: user._id,
        role: 'owner',
      }],
    });

    await whiteboard.save();

    // Emit socket event
    const io = getIO();
    if (io) {
      const room = chatId ? `chat:${chatId}` : `group:${groupId}`;
      io.to(room).emit('whiteboard:update', {
        action: 'created',
        whiteboard: await Whiteboard.findById(whiteboard._id).populate('createdBy', 'name email profilePhoto'),
      });
    }

    return NextResponse.json({ whiteboard }, { status: 201 });
  } catch (error) {
    console.error('Error creating whiteboard:', error);
    return NextResponse.json({ error: 'Failed to create whiteboard' }, { status: 500 });
  }
}

