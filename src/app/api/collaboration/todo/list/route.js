import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth.js';
import ToDo from '../../../../../models/ToDo.js';
import connectDB from '../../../../../lib/mongodb.js';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const filter = searchParams.get('filter'); // 'pending', 'completed', 'assigned-to-me'

    let query = {};

    if (chatId) {
      query.chatId = chatId;
    } else if (groupId) {
      query.groupId = groupId;
    }

    if (status) {
      query.status = status;
    }

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (filter === 'assigned-to-me') {
      query.assignedTo = user._id;
    } else if (filter === 'pending') {
      query.status = { $in: ['pending', 'in-progress'] };
    } else if (filter === 'completed') {
      query.status = 'completed';
    }

    const todos = await ToDo.find(query)
      .populate('createdBy', 'name email profilePhoto')
      .populate('assignedTo', 'name email profilePhoto')
      .populate('completedBy', 'name email profilePhoto')
      .sort({ createdAt: -1 });

    return NextResponse.json({ todos });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

