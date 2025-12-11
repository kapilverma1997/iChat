import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import ToDo from '../../../../../../models/ToDo.js';
import TaskAssignment from '../../../../../../models/TaskAssignment.js';
import { getIO } from '../../../../../../lib/socket.js';
import connectDB from '../../../../../../lib/mongodb.js';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todo = await ToDo.findById(params.id)
      .populate('createdBy', 'name email profilePhoto')
      .populate('assignedTo', 'name email profilePhoto')
      .populate('completedBy', 'name email profilePhoto')
      .populate('comments.user', 'name email profilePhoto')
      .populate('activityLog.user', 'name email profilePhoto');

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ todo });
  } catch (error) {
    console.error('Error fetching todo:', error);
    return NextResponse.json({ error: 'Failed to fetch todo' }, { status: 500 });
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
    const { title, description, status, priority, dueDate, assignedTo, tags } = body;

    const todo = await ToDo.findById(params.id);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const updates = {};
    const activityLog = [];

    if (title !== undefined) {
      updates.title = title;
      activityLog.push({ action: 'title_updated', user: user._id, details: { old: todo.title, new: title } });
    }
    if (description !== undefined) updates.description = description;
    if (status !== undefined) {
      updates.status = status;
      if (status === 'completed') {
        updates.completedAt = new Date();
        updates.completedBy = user._id;
        activityLog.push({ action: 'completed', user: user._id });
      }
    }
    if (priority !== undefined) {
      updates.priority = priority;
      activityLog.push({ action: 'priority_updated', user: user._id, details: { priority } });
    }
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (tags !== undefined) updates.tags = tags;

    if (assignedTo !== undefined && assignedTo !== todo.assignedTo?.toString()) {
      updates.assignedTo = assignedTo || null;
      
      // Create or update task assignment
      if (assignedTo) {
        await TaskAssignment.findOneAndUpdate(
          { taskId: todo._id, assignedTo },
          {
            taskId: todo._id,
            assignedTo,
            assignedBy: user._id,
            dueDate: dueDate || todo.dueDate,
            notified: false,
          },
          { upsert: true, new: true }
        );

        // Emit socket event
        const io = getIO();
        if (io) {
          io.to(`user:${assignedTo}`).emit('task:assigned', {
            task: { ...todo.toObject(), ...updates },
            assignedBy: user,
          });
        }
      }

      activityLog.push({ action: 'assigned', user: user._id, details: { assignedTo } });
    }

    if (activityLog.length > 0) {
      updates.$push = { activityLog: { $each: activityLog } };
    }

    const updatedTodo = await ToDo.findByIdAndUpdate(params.id, updates, { new: true })
      .populate('createdBy', 'name email profilePhoto')
      .populate('assignedTo', 'name email profilePhoto')
      .populate('completedBy', 'name email profilePhoto');

    // Emit socket event
    const io = getIO();
    if (io) {
      const room = updatedTodo.chatId ? `chat:${updatedTodo.chatId}` : `group:${updatedTodo.groupId}`;
      io.to(room).emit('todo:update', {
        action: 'updated',
        todo: updatedTodo,
      });
    }

    return NextResponse.json({ todo: updatedTodo });
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todo = await ToDo.findById(params.id);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Check if user is creator
    if (todo.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const chatId = todo.chatId;
    const groupId = todo.groupId;

    await ToDo.findByIdAndDelete(params.id);
    await TaskAssignment.deleteMany({ taskId: params.id });

    // Emit socket event
    const io = getIO();
    if (io) {
      const room = chatId ? `chat:${chatId}` : `group:${groupId}`;
      io.to(room).emit('todo:update', {
        action: 'deleted',
        todoId: params.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}

