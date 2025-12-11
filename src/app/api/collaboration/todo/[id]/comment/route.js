import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import ToDo from '../../../../../../../models/ToDo.js';
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
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const todo = await ToDo.findByIdAndUpdate(
      params.id,
      {
        $push: {
          comments: {
            user: user._id,
            content,
          },
          activityLog: {
            action: 'comment_added',
            user: user._id,
            details: { content },
          },
        },
      },
      { new: true }
    )
      .populate('comments.user', 'name email profilePhoto')
      .populate('createdBy', 'name email profilePhoto')
      .populate('assignedTo', 'name email profilePhoto');

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Emit socket event
    const io = getIO();
    if (io) {
      const room = todo.chatId ? `chat:${todo.chatId}` : `group:${todo.groupId}`;
      io.to(room).emit('todo:update', {
        action: 'comment_added',
        todo,
      });
    }

    return NextResponse.json({ todo });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}

