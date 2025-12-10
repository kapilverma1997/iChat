import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import Group from '../../../../../../models/Group.js';
import GroupMessage from '../../../../../../models/GroupMessage.js';
import { getMemberRole, hasPermission } from '../../../../../../lib/groupPermissions.js';
import { emitGroupEvent } from '../../../../../../lib/socket.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId, messageId, unpin } = await request.json();

    if (!groupId || !messageId) {
      return NextResponse.json({ error: 'Group ID and message ID are required' }, { status: 400 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    if (!hasPermission(userRole, 'canPinMessages')) {
      return NextResponse.json({ error: 'You do not have permission to pin messages' }, { status: 403 });
    }

    const message = await GroupMessage.findById(messageId);
    if (!message || message.groupId.toString() !== groupId) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (unpin) {
      // Unpin message
      group.pinnedMessages = group.pinnedMessages.filter(
        pm => pm.messageId.toString() !== messageId
      );
      message.isPinned = false;
    } else {
      // Pin message
      const existingPin = group.pinnedMessages.find(
        pm => pm.messageId.toString() === messageId
      );

      if (!existingPin) {
        group.pinnedMessages.push({
          messageId: message._id,
          pinnedAt: new Date(),
          pinnedBy: user._id,
        });
        message.isPinned = true;
      }
    }

    await group.save();
    await message.save();

    await group.populate('pinnedMessages.messageId');
    await group.populate('pinnedMessages.pinnedBy', 'name email profilePhoto');

    // Emit socket event
    emitGroupEvent(groupId, 'group:pinMessage', {
      group: group.toObject(),
      messageId: messageId.toString(),
      unpin,
    });

    return NextResponse.json({
      message: unpin ? 'Message unpinned successfully' : 'Message pinned successfully',
      group,
    });
  } catch (error) {
    console.error('Pin message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

