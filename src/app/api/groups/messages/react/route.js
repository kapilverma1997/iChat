import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import Group from '../../../../../../models/Group.js';
import GroupMessage from '../../../../../../models/GroupMessage.js';
import User from '../../../../../../models/User.js';
import { getMemberRole, hasPermission } from '../../../../../../lib/groupPermissions.js';
import { emitGroupEvent } from '../../../../../../lib/socket.js';
import { notifyReaction } from '../../../../../../lib/notifications.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, emoji } = await request.json();

    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'Message ID and emoji are required' }, { status: 400 });
    }

    const message = await GroupMessage.findById(messageId);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const group = await Group.findById(message.groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // Check if reactions are allowed in this group
    if (group.settings.allowReactions === false && !hasPermission(userRole, 'canChangeGroupInfo')) {
      return NextResponse.json({ error: 'Reactions are disabled in this group' }, { status: 403 });
    }

    // Check if reaction already exists
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === user._id.toString() && r.emoji === emoji
    );

    const isRemoving = existingReactionIndex !== -1;

    if (isRemoving) {
      // Remove reaction
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Remove other reactions from same user
      message.reactions = message.reactions.filter(
        (r) => r.userId.toString() !== user._id.toString()
      );
      // Add new reaction
      message.reactions.push({ emoji, userId: user._id });
    }

    await message.save();

    await message.populate('senderId', 'name email profilePhoto');

    // Emit socket event
    try {
      emitGroupEvent(message.groupId.toString(), 'reactionAdded', {
        messageId: message._id,
        reactions: message.reactions,
        groupId: message.groupId.toString(),
      });
    } catch (socketError) {
      console.error('Socket error:', socketError);
    }

    // Send notification to message sender if reaction was added (not removed)
    // Only send if the sender is different from the person reacting
    if (!isRemoving && message.senderId.toString() !== user._id.toString()) {
      try {
        const sender = await User.findById(message.senderId).select('name notificationSettings notificationPreferences');
        if (sender) {
          // Check if reaction notifications are enabled
          const reactionNotificationsEnabled = sender.notificationSettings?.reactionNotifications ?? 
                                               sender.notificationPreferences?.categories?.reactions ?? 
                                               true;
          
          if (reactionNotificationsEnabled) {
            await notifyReaction({
              userId: message.senderId.toString(),
              senderName: user.name || 'Someone',
              emoji,
              groupId: message.groupId.toString(),
              messageId: message._id.toString(),
              isGroupMessage: true,
            });
          }
        }
      } catch (notifError) {
        console.error('Error sending reaction notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      message: 'Reaction updated successfully',
      reactions: message.reactions,
    });
  } catch (error) {
    console.error('React to group message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

