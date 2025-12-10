import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Group from '../../../../../models/Group.js';
import User from '../../../../../models/User.js';
import { getMemberRole, hasPermission, isMember, isBanned } from '../../../../../lib/groupPermissions.js';
import { emitGroupEvent } from '../../../../../lib/socket.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId, userId, role } = await request.json();

    if (!groupId || !userId) {
      return NextResponse.json({ error: 'Group ID and User ID are required' }, { status: 400 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    if (!hasPermission(userRole, 'canAddMembers')) {
      return NextResponse.json({ error: 'You do not have permission to add members' }, { status: 403 });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (isMember(group, userId)) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    if (isBanned(group, userId)) {
      return NextResponse.json({ error: 'User is banned from this group' }, { status: 400 });
    }

    // Validate role
    const validRole = ['member', 'read-only'].includes(role) ? role : 'member';
    
    group.members.push({
      userId: userId,
      role: validRole,
      joinedAt: new Date(),
    });

    // Remove pending join request if exists
    group.joinRequests = group.joinRequests.filter(
      req => !(req.userId.toString() === userId.toString() && req.status === 'pending')
    );

    await group.save();

    await group.populate('members.userId', 'name email profilePhoto');
    await group.populate('createdBy', 'name email profilePhoto');

    // Emit socket event
    emitGroupEvent(groupId, 'group:addMember', {
      group: group.toObject(),
      addedUserId: userId.toString(),
    });

    return NextResponse.json({
      message: 'Member added successfully',
      group,
    });
  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

