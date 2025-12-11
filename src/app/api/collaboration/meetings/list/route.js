import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth.js';
import Meeting from '../../../../../models/Meeting.js';
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
    const upcoming = searchParams.get('upcoming');

    let query = {};

    if (chatId) {
      query.chatId = chatId;
    } else if (groupId) {
      query.groupId = groupId;
    }

    if (upcoming === 'true') {
      query.startTime = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'in-progress'] };
    }

    const meetings = await Meeting.find(query)
      .populate('createdBy', 'name email profilePhoto')
      .populate('participants.user', 'name email profilePhoto')
      .populate('cancelledBy', 'name email profilePhoto')
      .sort({ startTime: 1 });

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

