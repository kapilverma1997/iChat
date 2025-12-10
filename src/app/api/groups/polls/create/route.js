import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import Group from '../../../../../../models/Group.js';
import GroupMessage from '../../../../../../models/GroupMessage.js';
import GroupPoll from '../../../../../../models/GroupPoll.js';
import { getMemberRole, hasPermission } from '../../../../../../lib/groupPermissions.js';
import { emitGroupEvent } from '../../../../../../lib/socket.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId, question, options, allowMultipleChoices, isAnonymous, expiresAt } = await request.json();

    if (!groupId || !question || !options || options.length < 2) {
      return NextResponse.json({ error: 'Group ID, question, and at least 2 options are required' }, { status: 400 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // Check if only admins can create polls
    if (group.settings.onlyAdminsCreatePolls && !hasPermission(userRole, 'canCreatePolls')) {
      return NextResponse.json({ error: 'Only admins can create polls' }, { status: 403 });
    }

    // Create poll message
    const pollMessage = await GroupMessage.create({
      groupId,
      senderId: user._id,
      content: question,
      type: 'poll',
    });

    // Create poll
    const poll = await GroupPoll.create({
      groupId,
      messageId: pollMessage._id,
      createdBy: user._id,
      question: question.trim(),
      options: options.map(opt => ({ text: opt.trim(), votes: [] })),
      allowMultipleChoices: allowMultipleChoices || false,
      isAnonymous: isAnonymous || false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    // Update group last message
    group.lastMessage = pollMessage._id;
    group.lastMessageAt = new Date();
    await group.save();

    await poll.populate('createdBy', 'name email profilePhoto');
    await pollMessage.populate('senderId', 'name email profilePhoto');

    // Emit socket event
    emitGroupEvent(groupId, 'group:pollCreate', {
      poll: poll.toObject(),
      pollMessage: pollMessage.toObject(),
      groupId: groupId.toString(),
    });

    return NextResponse.json({
      message: 'Poll created successfully',
      poll,
      pollMessage,
    });
  } catch (error) {
    console.error('Create poll error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

