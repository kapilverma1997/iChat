import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Note from '../../../../../../models/Note.js';
import { getIO } from '../../../../../../lib/socket.js';
import connectDB from '../../../../../../lib/mongodb.js';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const note = await Note.findById(params.id)
      .populate('createdBy', 'name email profilePhoto')
      .populate('pinnedBy', 'name email profilePhoto')
      .populate('collaborators.user', 'name email profilePhoto')
      .populate('versionHistory.editedBy', 'name email profilePhoto');

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 });
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
    const { title, content, isPinned, tags } = body;

    const note = await Note.findById(params.id);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if user has edit permission
    const collaborator = note.collaborators.find(
      (c) => c.user.toString() === user._id.toString()
    );
    if (!collaborator || (collaborator.role !== 'owner' && collaborator.role !== 'editor')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = {};
    const newVersion = note.currentVersion + 1;

    if (title !== undefined) updates.title = title;
    if (tags !== undefined) updates.tags = tags;

    if (content !== undefined && content !== note.content) {
      updates.content = content;
      updates.currentVersion = newVersion;
      updates.$push = {
        versionHistory: {
          version: newVersion,
          content,
          editedBy: user._id,
          changeSummary: `Updated by ${user.name}`,
        },
      };
    }

    if (isPinned !== undefined) {
      updates.isPinned = isPinned;
      if (isPinned) {
        updates.pinnedAt = new Date();
        updates.pinnedBy = user._id;
      } else {
        updates.pinnedAt = null;
        updates.pinnedBy = null;
      }
    }

    const updatedNote = await Note.findByIdAndUpdate(params.id, updates, { new: true })
      .populate('createdBy', 'name email profilePhoto')
      .populate('pinnedBy', 'name email profilePhoto')
      .populate('collaborators.user', 'name email profilePhoto');

    // Emit socket event for real-time sync
    const io = getIO();
    if (io) {
      const room = updatedNote.chatId ? `chat:${updatedNote.chatId}` : `group:${updatedNote.groupId}`;
      io.to(room).emit('notes:update', {
        action: 'updated',
        note: updatedNote,
      });
    }

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const note = await Note.findById(params.id);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if user is owner
    const collaborator = note.collaborators.find(
      (c) => c.user.toString() === user._id.toString() && c.role === 'owner'
    );
    if (!collaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const chatId = note.chatId;
    const groupId = note.groupId;

    await Note.findByIdAndDelete(params.id);

    // Emit socket event
    const io = getIO();
    if (io) {
      const room = chatId ? `chat:${chatId}` : `group:${groupId}`;
      io.to(room).emit('notes:update', {
        action: 'deleted',
        noteId: params.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}

