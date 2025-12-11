import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth.js';
import Document from '../../../../../models/Document.js';
import DocumentVersion from '../../../../../models/DocumentVersion.js';
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
    const { title, content, chatId, groupId, format } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const document = new Document({
      title,
      content: content || '',
      chatId: chatId || null,
      groupId: groupId || null,
      createdBy: user._id,
      format: format || 'text',
      collaborators: [{
        user: user._id,
        role: 'owner',
      }],
    });

    await document.save();

    // Create initial version
    const version = new DocumentVersion({
      documentId: document._id,
      version: 1,
      content: content || '',
      createdBy: user._id,
      changeSummary: 'Initial version',
      metadata: {
        wordCount: (content || '').split(/\s+/).length,
        characterCount: (content || '').length,
        lineCount: (content || '').split('\n').length,
      },
    });
    await version.save();

    // Emit socket event
    const io = getIO();
    if (io) {
      const room = chatId ? `chat:${chatId}` : `group:${groupId}`;
      io.to(room).emit('document:update', {
        action: 'created',
        document: await Document.findById(document._id).populate('createdBy', 'name email profilePhoto'),
      });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

