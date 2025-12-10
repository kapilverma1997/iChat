import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Group from '../../../../../models/Group.js';
import { getMemberRole, hasPermission } from '../../../../../lib/groupPermissions.js';
import { emitGroupEvent } from '../../../../../lib/socket.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId, requestId, approve } = await request.json();

    if (!groupId || requestId === undefined) {
      return NextResponse.json({ error: 'Group ID and request ID are required' }, { status: 400 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole || !hasPermission(userRole, 'canAddMembers')) {
      return NextResponse.json({ error: 'You do not have permission to approve join requests' }, { status: 403 });
    }

    const joinRequest = group.joinRequests.id(requestId);
    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 });
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Join request already processed' }, { status: 400 });
    }

    if (approve) {
      // Approve: add as member
      group.members.push({
        userId: joinRequest.userId,
        role: 'member',
        joinedAt: new Date(),
      });
      joinRequest.status = 'approved';
    } else {
      // Reject
      joinRequest.status = 'rejected';
    }

    await group.save();

    await group.populate('members.userId', 'name email profilePhoto');
    await group.populate('joinRequests.userId', 'name email profilePhoto');

    // Emit socket event
    if (approve) {
      emitGroupEvent(groupId, 'group:joinApproved', {
        group: group.toObject(),
        userId: joinRequest.userId.toString(),
      });
    }

    return NextResponse.json({
      message: approve ? 'Join request approved' : 'Join request rejected',
      group,
    });
  } catch (error) {
    console.error('Approve request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

