import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Group from '../../../../../models/Group.js';
import { getMemberRole, canManageRole } from '../../../../../lib/groupPermissions.js';
import { emitGroupEvent } from '../../../../../lib/socket.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId, userId, newRole } = await request.json();

    if (!groupId || !userId || !newRole) {
      return NextResponse.json({ error: 'Group ID, User ID, and new role are required' }, { status: 400 });
    }

    const validRoles = ['owner', 'admin', 'moderator', 'member', 'read-only'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    const targetMember = group.members.find(m => m.userId.toString() === userId.toString());
    if (!targetMember) {
      return NextResponse.json({ error: 'User is not a member of this group' }, { status: 404 });
    }

    // Check if user can manage this role change
    if (!canManageRole(userRole, targetMember.role)) {
      return NextResponse.json({ error: 'You do not have permission to change this member\'s role' }, { status: 403 });
    }

    if (!canManageRole(userRole, newRole)) {
      return NextResponse.json({ error: 'You do not have permission to assign this role' }, { status: 403 });
    }

    // Special case: transferring ownership
    if (newRole === 'owner') {
      // Current owner becomes admin
      const currentOwner = group.members.find(m => m.role === 'owner');
      if (currentOwner) {
        currentOwner.role = 'admin';
      }
    }

    // Update role
    targetMember.role = newRole;

    await group.save();

    await group.populate('members.userId', 'name email profilePhoto');
    await group.populate('createdBy', 'name email profilePhoto');

    // Emit socket event
    emitGroupEvent(groupId, 'group:promoteRole', {
      group: group.toObject(),
      userId: userId.toString(),
      newRole,
    });

    return NextResponse.json({
      message: 'Member role updated successfully',
      group,
    });
  } catch (error) {
    console.error('Promote member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

