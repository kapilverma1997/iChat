import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Group from '../../../../../models/Group.js';
import { isMember, isBanned } from '../../../../../lib/groupPermissions.js';
import { emitGroupEvent } from '../../../../../lib/socket.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if already a member
    if (isMember(group, user._id)) {
      return NextResponse.json({ error: 'You are already a member of this group' }, { status: 400 });
    }

    // Check if banned
    if (isBanned(group, user._id)) {
      return NextResponse.json({ error: 'You are banned from this group' }, { status: 403 });
    }

    // Handle different group types
    if (group.groupType === 'public') {
      // Public groups: join directly
      group.members.push({
        userId: user._id,
        role: 'member',
        joinedAt: new Date(),
      });
      await group.save();
    } else if (group.groupType === 'private') {
      // Private groups: create join request
      const existingRequest = group.joinRequests.find(
        req => req.userId.toString() === user._id.toString() && req.status === 'pending'
      );

      if (existingRequest) {
        return NextResponse.json({ error: 'Join request already pending' }, { status: 400 });
      }

      group.joinRequests.push({
        userId: user._id,
        requestedAt: new Date(),
        status: 'pending',
      });
      await group.save();
    } else if (group.groupType === 'announcement') {
      return NextResponse.json({ error: 'Announcement groups are admin-only' }, { status: 403 });
    }

    await group.populate('members.userId', 'name email profilePhoto');
    await group.populate('joinRequests.userId', 'name email profilePhoto');

    // Emit socket events
    if (group.groupType === 'public') {
      emitGroupEvent(groupId, 'group:joinApproved', {
        group: group.toObject(),
        userId: user._id.toString(),
      });
    } else {
      emitGroupEvent(groupId, 'group:joinRequest', {
        group: group.toObject(),
        userId: user._id.toString(),
      });
    }

    return NextResponse.json({
      message: group.groupType === 'public' ? 'Joined group successfully' : 'Join request sent',
      group,
      isRequest: group.groupType === 'private',
    });
  } catch (error) {
    console.error('Join group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

