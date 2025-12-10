import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Group from '../../../../../models/Group.js';
import GroupMessage from '../../../../../models/GroupMessage.js';
import { getMemberRole, hasPermission } from '../../../../../lib/groupPermissions.js';
import { emitGroupEvent } from '../../../../../lib/socket.js';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;

    const group = await Group.findById(groupId)
      .populate('members.userId', 'name email profilePhoto presenceStatus lastSeen')
      .populate('createdBy', 'name email profilePhoto')
      .populate('joinRequests.userId', 'name email profilePhoto')
      .populate('bannedUsers.userId', 'name email profilePhoto')
      .populate('pinnedMessages.messageId')
      .populate('pinnedMessages.pinnedBy', 'name email profilePhoto')
      .populate('lastMessage');

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    const isMember = !!userRole;

    // Private groups: only members can see
    if (group.groupType === 'private' && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      group: {
        ...group.toObject(),
        userRole,
        isMember,
        memberCount: group.members.length,
      },
    });
  } catch (error) {
    console.error('Get group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;
    const { name, description, groupPhoto, welcomeMessage, groupType, settings } = await request.json();

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // Check permissions
    if (settings && !hasPermission(userRole, 'canChangeGroupInfo')) {
      return NextResponse.json({ error: 'You do not have permission to change group settings' }, { status: 403 });
    }

    if ((name || description || groupPhoto || welcomeMessage || groupType) && !hasPermission(userRole, 'canChangeGroupInfo')) {
      return NextResponse.json({ error: 'You do not have permission to change group info' }, { status: 403 });
    }

    // Update fields
    if (name !== undefined) group.name = name.trim();
    if (description !== undefined) group.description = description?.trim() || '';
    if (groupPhoto !== undefined) group.groupPhoto = groupPhoto;
    if (welcomeMessage !== undefined) group.welcomeMessage = welcomeMessage?.trim() || '';
    if (groupType && ['public', 'private', 'announcement'].includes(groupType)) {
      group.groupType = groupType;
    }
    if (settings) {
      group.settings = { ...group.settings, ...settings };
    }

    await group.save();

    await group.populate('members.userId', 'name email profilePhoto');
    await group.populate('createdBy', 'name email profilePhoto');

    // Emit socket event
    emitGroupEvent(groupId, 'group:updateInfo', {
      group: group.toObject(),
    });

    return NextResponse.json({
      message: 'Group updated successfully',
      group,
    });
  } catch (error) {
    console.error('Update group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

