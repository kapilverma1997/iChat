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

    const { groupId, parentMessageId, content, type, fileUrl, fileName, fileSize, metadata } = await request.json();

    if (!groupId || !parentMessageId || !content) {
      return NextResponse.json({ error: 'Group ID, parent message ID, and content are required' }, { status: 400 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    if (!hasPermission(userRole, 'canSendMessage')) {
      return NextResponse.json({ error: 'You do not have permission to send messages' }, { status: 403 });
    }

    if (!group.settings.allowReplies) {
      return NextResponse.json({ error: 'Replies are disabled in this group' }, { status: 403 });
    }

    // Find parent message
    const parentMessage = await GroupMessage.findById(parentMessageId);
    if (!parentMessage || parentMessage.groupId.toString() !== groupId) {
      return NextResponse.json({ error: 'Parent message not found' }, { status: 404 });
    }

    // Determine threadId (use parent's threadId if exists, otherwise use parent's _id)
    const threadId = parentMessage.threadId || parentMessage._id;

    // Create thread reply
    const threadMessage = await GroupMessage.create({
      groupId,
      senderId: user._id,
      content: content.trim(),
      type: type || 'text',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      metadata: metadata || {},
      replyTo: parentMessageId,
      threadId,
    });

    // Update thread count on parent message
    await GroupMessage.updateOne(
      { _id: threadId },
      { $inc: { threadCount: 1 } }
    );

    // Update group last message
    group.lastMessage = threadMessage._id;
    group.lastMessageAt = new Date();
    await group.save();

    await threadMessage.populate('senderId', 'name email profilePhoto');
    await threadMessage.populate('replyTo');
    await threadMessage.populate('threadId');

    // Emit socket event
    emitGroupEvent(groupId, 'group:threadMessage', {
      threadMessage: threadMessage.toObject(),
      groupId: groupId.toString(),
    });

    return NextResponse.json({
      message: 'Thread reply sent successfully',
      threadMessage,
    });
  } catch (error) {
    console.error('Send thread message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

