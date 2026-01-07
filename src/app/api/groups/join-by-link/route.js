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

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Invite token is required' }, { status: 400 });
    }

    // Find group by invite token
    const group = await Group.findOne({ inviteToken: token });
    if (!group) {
      return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 });
    }

    // Check if already a member
    if (isMember(group, user._id)) {
      return NextResponse.json({ error: 'You are already a member of this group' }, { status: 400 });
    }

    // Check if banned
    if (isBanned(group, user._id)) {
      return NextResponse.json({ error: 'You are banned from this group' }, { status: 403 });
    }

    // Announcement groups cannot be joined via invite link
    if (group.groupType === 'announcement') {
      return NextResponse.json({ error: 'Announcement groups cannot be joined via invite link' }, { status: 403 });
    }

    // Add user as member
    group.members.push({
      userId: user._id,
      role: 'member',
      joinedAt: new Date(),
    });
    await group.save();

    await group.populate('members.userId', 'name email profilePhoto');
    await group.populate('joinRequests.userId', 'name email profilePhoto');

    // Emit socket event
    emitGroupEvent(group._id.toString(), 'group:joinApproved', {
      group: group.toObject(),
      userId: user._id.toString(),
    });

    return NextResponse.json({
      message: 'Joined group successfully',
      group,
    });
  } catch (error) {
    console.error('Join by link error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


