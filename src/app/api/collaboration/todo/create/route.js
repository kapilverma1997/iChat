import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth.js';
import ToDo from '../../../../../models/ToDo.js';
import TaskAssignment from '../../../../../models/TaskAssignment.js';
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
    const { title, description, chatId, groupId, assignedTo, dueDate, priority, tags } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const todo = new ToDo({
      title,
      description: description || '',
      chatId: chatId || null,
      groupId: groupId || null,
      createdBy: user._id,
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
      priority: priority || 'medium',
      tags: tags || [],
      activityLog: [{
        action: 'created',
        user: user._id,
        details: { title },
      }],
    });

    await todo.save();

    // Create task assignment if assignedTo is provided
    if (assignedTo) {
      const assignment = new TaskAssignment({
        taskId: todo._id,
        assignedTo,
        assignedBy: user._id,
        dueDate: dueDate || null,
      });
      await assignment.save();

      // Emit socket event
      const io = getIO();
      if (io) {
        io.to(`user:${assignedTo}`).emit('task:assigned', {
          task: todo,
          assignedBy: user,
        });
      }
    }

    // Emit socket event for real-time update
    const io = getIO();
    if (io) {
      const room = chatId ? `chat:${chatId}` : `group:${groupId}`;
      io.to(room).emit('todo:update', {
        action: 'created',
        todo: await ToDo.findById(todo._id).populate('createdBy', 'name email profilePhoto'),
      });
    }

    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}

