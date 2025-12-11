import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import Note from '../../../../../../../models/Note.js';
import { getIO } from '../../../../../../../lib/socket.js';
import connectDB from '../../../../../../../lib/mongodb.js';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const note = await Note.findById(params.id);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if user has permission to add collaborators
    const collaborator = note.collaborators.find(
      (c) => c.user.toString() === user._id.toString()
    );
    if (!collaborator || collaborator.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user is already a collaborator
    const existingCollaborator = note.collaborators.find(
      (c) => c.user.toString() === userId
    );
    if (existingCollaborator) {
      return NextResponse.json({ error: 'User is already a collaborator' }, { status: 400 });
    }

    const updatedNote = await Note.findByIdAndUpdate(
      params.id,
      {
        $push: {
          collaborators: {
            user: userId,
            role: role || 'editor',
          },
        },
      },
      { new: true }
    )
      .populate('collaborators.user', 'name email profilePhoto');

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('notes:update', {
        action: 'collaborator_added',
        note: updatedNote,
      });
      const room = updatedNote.chatId ? `chat:${updatedNote.chatId}` : `group:${updatedNote.groupId}`;
      io.to(room).emit('notes:update', {
        action: 'collaborator_added',
        note: updatedNote,
      });
    }

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error('Error adding collaborator:', error);
    return NextResponse.json({ error: 'Failed to add collaborator' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const note = await Note.findById(params.id);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if user has permission
    const collaborator = note.collaborators.find(
      (c) => c.user.toString() === user._id.toString()
    );
    if (!collaborator || collaborator.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedNote = await Note.findByIdAndUpdate(
      params.id,
      {
        $pull: {
          collaborators: { user: userId },
        },
      },
      { new: true }
    );

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('notes:update', {
        action: 'collaborator_removed',
        noteId: params.id,
      });
      const room = updatedNote.chatId ? `chat:${updatedNote.chatId}` : `group:${updatedNote.groupId}`;
      io.to(room).emit('notes:update', {
        action: 'collaborator_removed',
        note: updatedNote,
      });
    }

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 });
  }
}

