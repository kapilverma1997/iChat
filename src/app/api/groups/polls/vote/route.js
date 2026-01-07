import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import Group from '../../../../../../models/Group.js';
import GroupPoll from '../../../../../../models/GroupPoll.js';
import { getMemberRole } from '../../../../../../lib/groupPermissions.js';
import { emitGroupEvent } from '../../../../../../lib/socket.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pollId, optionIndexes } = await request.json();

    if (!pollId || optionIndexes === undefined || !Array.isArray(optionIndexes)) {
      return NextResponse.json({ error: 'Poll ID and option indexes are required' }, { status: 400 });
    }

    const poll = await GroupPoll.findById(pollId);
    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    const group = await Group.findById(poll.groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    if (poll.isClosed) {
      return NextResponse.json({ error: 'Poll is closed' }, { status: 400 });
    }

    if (poll.expiresAt && new Date() > poll.expiresAt) {
      poll.isClosed = true;
      poll.closedAt = new Date();
      await poll.save();
      return NextResponse.json({ error: 'Poll has expired' }, { status: 400 });
    }

    // Check if user already voted
    const hasVoted = poll.options.some(opt => 
      opt.votes && opt.votes.some(vote => {
        const voteUserId = vote.userId?._id?.toString() || vote.userId?.toString();
        return voteUserId === user._id.toString();
      })
    );

    if (hasVoted && !poll.allowMultipleChoices) {
      return NextResponse.json({ error: 'You have already voted' }, { status: 400 });
    }

    // Validate option indexes
    if (optionIndexes.length === 0 || optionIndexes.some(idx => idx < 0 || idx >= poll.options.length)) {
      return NextResponse.json({ error: 'Invalid option indexes' }, { status: 400 });
    }

    if (!poll.allowMultipleChoices && optionIndexes.length > 1) {
      return NextResponse.json({ error: 'Multiple choices not allowed' }, { status: 400 });
    }

    // Remove existing votes if not allowing multiple choices
    // For single choice polls, remove user's vote from all options before adding new vote
    if (!poll.allowMultipleChoices && hasVoted) {
      poll.options.forEach((opt, optIdx) => {
        if (!opt.votes) {
          opt.votes = [];
        }
        const originalLength = opt.votes.length;
        opt.votes = opt.votes.filter(vote => {
          const voteUserId = vote.userId?._id?.toString() || vote.userId?.toString();
          return voteUserId !== user._id.toString();
        });
        // Mark as modified if votes were removed
        if (opt.votes.length !== originalLength) {
          poll.markModified(`options.${optIdx}.votes`);
        }
      });
    }

    // For multiple choice polls, remove votes from options that are not in the new selection
    if (poll.allowMultipleChoices && hasVoted) {
      poll.options.forEach((opt, optIdx) => {
        if (!opt.votes) {
          opt.votes = [];
        }
        const originalLength = opt.votes.length;
        // Remove user's vote if this option is not in the new selection
        if (!optionIndexes.includes(optIdx)) {
          opt.votes = opt.votes.filter(vote => {
            const voteUserId = vote.userId?._id?.toString() || vote.userId?.toString();
            return voteUserId !== user._id.toString();
          });
          if (opt.votes.length !== originalLength) {
            poll.markModified(`options.${optIdx}.votes`);
          }
        }
      });
    }

    // Add votes to selected options
    optionIndexes.forEach(idx => {
      // Ensure votes array exists
      if (!poll.options[idx].votes) {
        poll.options[idx].votes = [];
      }
      
      const existingVote = poll.options[idx].votes.find(vote => {
        const voteUserId = vote.userId?._id?.toString() || vote.userId?.toString();
        return voteUserId === user._id.toString();
      });
      
      if (!existingVote) {
        poll.options[idx].votes.push({
          userId: user._id,
          votedAt: new Date(),
        });
        // Mark the nested array as modified
        poll.markModified(`options.${idx}.votes`);
      }
    });

    // Recalculate totalVotes - for multiple choice, count all votes; for single choice, count unique voters
    if (poll.allowMultipleChoices) {
      // Count all votes across all options
      poll.totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
    } else {
      // Count unique voters (each user can only vote once)
      const uniqueVoters = new Set();
      poll.options.forEach(opt => {
        if (opt.votes) {
          opt.votes.forEach(vote => {
            const voteUserId = vote.userId?._id?.toString() || vote.userId?.toString();
            if (voteUserId) {
              uniqueVoters.add(voteUserId);
            }
          });
        }
      });
      poll.totalVotes = uniqueVoters.size;
    }
    
    // Mark totalVotes as modified
    poll.markModified('totalVotes');
    
    // Save the poll
    await poll.save();

    // Reload poll with populated fields
    const updatedPoll = await GroupPoll.findById(poll._id)
      .populate('createdBy', 'name email profilePhoto')
      .populate('options.votes.userId', 'name email profilePhoto');

    // Emit socket event for real-time updates
    emitGroupEvent(updatedPoll.groupId.toString(), 'group:pollVote', {
      poll: updatedPoll.toObject(),
      pollId: updatedPoll._id.toString(),
      groupId: updatedPoll.groupId.toString(),
    });

    return NextResponse.json({
      message: 'Vote recorded successfully',
      poll: updatedPoll,
    });
  } catch (error) {
    console.error('Vote poll error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

