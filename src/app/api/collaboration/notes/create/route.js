import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth.js';
import Note from '../../../../../models/Note.js';
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
    const { title, content, chatId, groupId, tags } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const note = new Note({
      title,
      content: content || '',
      chatId: chatId || null,
      groupId: groupId || null,
      createdBy: user._id,
      tags: tags || [],
      collaborators: [{
        user: user._id,
        role: 'owner',
      }],
      versionHistory: [{
        version: 1,
        content: content || '',
        editedBy: user._id,
        changeSummary: 'Initial version',
      }],
    });

    await note.save();

    // Emit socket event
    const io = getIO();
    if (io) {
      const room = chatId ? `chat:${chatId}` : `group:${groupId}`;
      io.to(room).emit('notes:update', {
        action: 'created',
        note: await Note.findById(note._id).populate('createdBy', 'name email profilePhoto'),
      });
    }

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

