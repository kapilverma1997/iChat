import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import Group from '../../../../../../models/Group.js';
import GroupMessage from '../../../../../../models/GroupMessage.js';
import { getMemberRole } from '../../../../../../lib/groupPermissions.js';

export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const threadId = searchParams.get('threadId');

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole && group.groupType === 'private') {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    const query = {
      groupId,
      isDeleted: false,
    };

    if (threadId) {
      query.threadId = threadId;
    } else {
      query.$or = [{ threadId: null }, { threadId: { $exists: false } }];
    }

    const messages = await GroupMessage.find(query)
      .populate('senderId', 'name email profilePhoto')
      .populate('replyTo')
      .populate('mentions.userId', 'name email profilePhoto')
      .populate('reactions.userId', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    // Reverse to show oldest first
    messages.reverse();

    return NextResponse.json({
      messages,
      page,
      limit,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error('List group messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

