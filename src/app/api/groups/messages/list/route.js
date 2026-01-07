import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import Group from '../../../../../../models/Group.js';
import GroupMessage from '../../../../../../models/GroupMessage.js';
import GroupPoll from '../../../../../../models/GroupPoll.js';
import GroupEvent from '../../../../../../models/GroupEvent.js';
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
      .populate('senderId', 'name email profilePhoto privacySettings')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'senderId',
          select: 'name email profilePhoto privacySettings'
        }
      })
      .populate('mentions.userId', 'name email profilePhoto privacySettings')
      .populate('reactions.userId', 'name email profilePhoto privacySettings')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    // Reverse to show oldest first
    messages.reverse();

    // Fetch poll data for poll messages
    const pollMessageIds = messages
      .filter(msg => msg.type === 'poll')
      .map(msg => msg._id);

    const polls = await GroupPoll.find({ messageId: { $in: pollMessageIds } })
      .populate('createdBy', 'name email profilePhoto')
      .populate('options.votes.userId', 'name email profilePhoto');

    // Create a map of messageId -> poll and recalculate totalVotes if needed
    const pollMap = {};
    polls.forEach(poll => {
      const pollObj = poll.toObject();
      
      // Recalculate totalVotes to ensure accuracy
      if (pollObj.allowMultipleChoices) {
        // For multiple choice, count all votes across all options
        pollObj.totalVotes = pollObj.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
      } else {
        // For single choice, count unique voters
        const uniqueVoters = new Set();
        pollObj.options.forEach(opt => {
          if (opt.votes) {
            opt.votes.forEach(vote => {
              const voteUserId = vote.userId?._id?.toString() || vote.userId?.toString();
              if (voteUserId) {
                uniqueVoters.add(voteUserId);
              }
            });
          }
        });
        pollObj.totalVotes = uniqueVoters.size;
      }
      
      pollMap[poll.messageId.toString()] = pollObj;
    });

    // Fetch event data for event messages
    const eventMessageIds = messages
      .filter(msg => msg.type === 'event')
      .map(msg => msg._id);

    const events = await GroupEvent.find({ messageId: { $in: eventMessageIds } })
      .populate('createdBy', 'name email profilePhoto')
      .populate('attendees.userId', 'name email profilePhoto');

    // Create a map of messageId -> event
    const eventMap = {};
    events.forEach(event => {
      eventMap[event.messageId.toString()] = event.toObject();
    });

    // Attach poll and event data to messages
    const messagesWithData = messages.map(msg => {
      const messageObj = msg.toObject();
      if (msg.type === 'poll' && pollMap[msg._id.toString()]) {
        messageObj.poll = pollMap[msg._id.toString()];
      }
      if (msg.type === 'event' && eventMap[msg._id.toString()]) {
        messageObj.event = eventMap[msg._id.toString()];
      }
      return messageObj;
    });

    return NextResponse.json({
      messages: messagesWithData,
      page,
      limit,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error('List group messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

