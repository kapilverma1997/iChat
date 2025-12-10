import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Group from '../../../../../models/Group.js';
import { getMemberRole, hasPermission, canManageRole } from '../../../../../lib/groupPermissions.js';
import { emitGroupEvent } from '../../../../../lib/socket.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId, userId } = await request.json();

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

    // Cannot remove yourself
    if (userId === user._id.toString()) {
      return NextResponse.json({ error: 'You cannot remove yourself. Leave the group instead.' }, { status: 400 });
    }

    const targetMember = group.members.find(m => m.userId.toString() === userId.toString());
    if (!targetMember) {
      return NextResponse.json({ error: 'User is not a member of this group' }, { status: 404 });
    }

    // Check if user can manage this role
    if (!canManageRole(userRole, targetMember.role)) {
      return NextResponse.json({ error: 'You do not have permission to remove this member' }, { status: 403 });
    }

    // Remove member
    group.members = group.members.filter(m => m.userId.toString() !== userId.toString());

    await group.save();

    await group.populate('members.userId', 'name email profilePhoto');
    await group.populate('createdBy', 'name email profilePhoto');

    // Emit socket event
    emitGroupEvent(groupId, 'group:removeMember', {
      group: group.toObject(),
      removedUserId: userId.toString(),
    });

    return NextResponse.json({
      message: 'Member removed successfully',
      group,
    });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

