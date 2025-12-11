import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Document from '../../../../../../models/Document.js';
import DocumentVersion from '../../../../../../models/DocumentVersion.js';
import { getIO } from '../../../../../../lib/socket.js';
import connectDB from '../../../../../../lib/mongodb.js';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const document = await Document.findById(params.id)
      .populate('createdBy', 'name email profilePhoto')
      .populate('collaborators.user', 'name email profilePhoto')
      .populate('cursorPositions.user', 'name email profilePhoto');

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
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
    const { content, title, cursorPosition, changes } = body;

    const document = await Document.findById(params.id);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has edit permission
    const collaborator = document.collaborators.find(
      (c) => c.user.toString() === user._id.toString()
    );
    if (!collaborator || (collaborator.role !== 'owner' && collaborator.role !== 'editor')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = {};
    let newVersion = null;

    if (title !== undefined) updates.title = title;

    if (content !== undefined && content !== document.content) {
      updates.content = content;
      updates.currentVersion = document.currentVersion + 1;
      newVersion = document.currentVersion + 1;

      // Create new version
      const version = new DocumentVersion({
        documentId: document._id,
        version: newVersion,
        content,
        createdBy: user._id,
        changeSummary: changes?.summary || 'Document updated',
        changes: changes?.operations || [],
        metadata: {
          wordCount: content.split(/\s+/).length,
          characterCount: content.length,
          lineCount: content.split('\n').length,
        },
      });
      await version.save();
    }

    // Update cursor position
    if (cursorPosition) {
      const existingCursor = document.cursorPositions.find(
        (c) => c.user.toString() === user._id.toString()
      );
      if (existingCursor) {
        updates.$set = {
          'cursorPositions.$[elem].position': cursorPosition.position,
          'cursorPositions.$[elem].lastSeen': new Date(),
        };
        updates.arrayFilters = [{ 'elem.user': user._id }];
      } else {
        updates.$push = {
          cursorPositions: {
            user: user._id,
            position: cursorPosition.position,
            color: cursorPosition.color || '#000000',
            name: user.name,
            lastSeen: new Date(),
          },
        };
      }
    }

    const updatedDocument = await Document.findByIdAndUpdate(params.id, updates, { new: true })
      .populate('createdBy', 'name email profilePhoto')
      .populate('collaborators.user', 'name email profilePhoto')
      .populate('cursorPositions.user', 'name email profilePhoto');

    // Emit socket event for real-time sync
    const io = getIO();
    if (io) {
      const room = updatedDocument.chatId ? `chat:${updatedDocument.chatId}` : `group:${updatedDocument.groupId}`;
      io.to(room).emit('document:update', {
        action: 'updated',
        document: updatedDocument,
        cursorPosition: cursorPosition ? { user: user._id, ...cursorPosition } : null,
        version: newVersion,
      });
    }

    return NextResponse.json({ document: updatedDocument });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

