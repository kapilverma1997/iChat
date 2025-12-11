import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Whiteboard from '../../../../../../models/Whiteboard.js';
import { getIO } from '../../../../../../lib/socket.js';
import connectDB from '../../../../../../lib/mongodb.js';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const whiteboard = await Whiteboard.findById(params.id)
      .populate('createdBy', 'name email profilePhoto')
      .populate('collaborators.user', 'name email profilePhoto')
      .populate('images.uploadedBy', 'name email profilePhoto');

    if (!whiteboard) {
      return NextResponse.json({ error: 'Whiteboard not found' }, { status: 404 });
    }

    return NextResponse.json({ whiteboard });
  } catch (error) {
    console.error('Error fetching whiteboard:', error);
    return NextResponse.json({ error: 'Failed to fetch whiteboard' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { canvasData, title, settings, cursorPosition } = body;

    const whiteboard = await Whiteboard.findById(params.id);
    if (!whiteboard) {
      return NextResponse.json({ error: 'Whiteboard not found' }, { status: 404 });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (canvasData !== undefined) updates.canvasData = canvasData;
    if (settings !== undefined) updates.settings = settings;

    // Update cursor position
    if (cursorPosition) {
      const existingCursor = whiteboard.cursorPositions.find(
        (c) => c.user.toString() === user._id.toString()
      );
      if (existingCursor) {
        updates.$set = {
          'cursorPositions.$[elem].x': cursorPosition.x,
          'cursorPositions.$[elem].y': cursorPosition.y,
          'cursorPositions.$[elem].lastSeen': new Date(),
        };
        updates.arrayFilters = [{ 'elem.user': user._id }];
      } else {
        updates.$push = {
          cursorPositions: {
            user: user._id,
            x: cursorPosition.x,
            y: cursorPosition.y,
            color: cursorPosition.color || '#000000',
            name: user.name,
            lastSeen: new Date(),
          },
        };
      }
    }

    const updatedWhiteboard = await Whiteboard.findByIdAndUpdate(params.id, updates, { new: true })
      .populate('createdBy', 'name email profilePhoto')
      .populate('collaborators.user', 'name email profilePhoto');

    // Emit socket event for real-time sync
    const io = getIO();
    if (io) {
      const room = updatedWhiteboard.chatId ? `chat:${updatedWhiteboard.chatId}` : `group:${updatedWhiteboard.groupId}`;
      io.to(room).emit('whiteboard:update', {
        action: 'updated',
        whiteboard: updatedWhiteboard,
        cursorPosition: cursorPosition ? { user: user._id, ...cursorPosition } : null,
      });
    }

    return NextResponse.json({ whiteboard: updatedWhiteboard });
  } catch (error) {
    console.error('Error updating whiteboard:', error);
    return NextResponse.json({ error: 'Failed to update whiteboard' }, { status: 500 });
  }
}

