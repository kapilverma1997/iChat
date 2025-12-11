import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth.js';
import Note from '../../../../../models/Note.js';
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
    const pinned = searchParams.get('pinned');

    let query = {};

    if (chatId) {
      query.chatId = chatId;
    } else if (groupId) {
      query.groupId = groupId;
    }

    if (pinned === 'true') {
      query.isPinned = true;
    }

    const notes = await Note.find(query)
      .populate('createdBy', 'name email profilePhoto')
      .populate('pinnedBy', 'name email profilePhoto')
      .populate('collaborators.user', 'name email profilePhoto')
      .sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

