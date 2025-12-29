import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import Group from '../../../../../../models/Group.js';
import GroupMessage from '../../../../../../models/GroupMessage.js';
import MessageLog from '../../../../../../models/MessageLog.js';
import { getMemberRole, hasPermission } from '../../../../../../lib/groupPermissions.js';
import { emitGroupEvent } from '../../../../../../lib/socket.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId, content, type, fileUrl, fileName, fileSize, metadata, mentions, replyTo } = await request.json();

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Allow empty content for certain message types (emoji, location, contact, image, video, file)
    const messageType = type || 'text';
    // Ensure content is always a string, default to empty string
    const messageContent = (content !== null && content !== undefined) ? String(content) : '';

    // Only require content if it's a text message without a file
    if (!messageContent && !['emoji', 'location', 'contact', 'image', 'video', 'file', 'audio', 'voice'].includes(messageType) && !fileUrl) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // Check read-only mode
    if (group.settings.readOnly && !hasPermission(userRole, 'canChangeGroupInfo')) {
      return NextResponse.json({ error: 'Group is in read-only mode' }, { status: 403 });
    }

    // Check if user can send messages
    if (!hasPermission(userRole, 'canSendMessage')) {
      return NextResponse.json({ error: 'You do not have permission to send messages' }, { status: 403 });
    }

    // Check file restrictions
    if (fileUrl && group.settings.onlyAdminsSendFiles && !hasPermission(userRole, 'canChangeGroupInfo')) {
      return NextResponse.json({ error: 'Only admins can send files' }, { status: 403 });
    }

    // Validate replyTo
    let replyToMessage = null;
    if (replyTo) {
      replyToMessage = await GroupMessage.findById(replyTo);
      if (!replyToMessage || replyToMessage.groupId.toString() !== groupId) {
        return NextResponse.json({ error: 'Invalid reply message' }, { status: 400 });
      }
    }

    // Create message - ensure content is always a string (empty string is valid for images/videos/files)
    const finalContent = typeof messageContent === 'string' ? messageContent.trim() : '';
    const message = await GroupMessage.create({
      groupId,
      senderId: user._id,
      content: finalContent,
      type: messageType,
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      metadata: metadata || {},
      mentions: mentions || [],
      replyTo: replyTo || null,
    });

    // Update group last message
    group.lastMessage = message._id;
    group.lastMessageAt = new Date();
    await group.save();

    // Log message for admin tracking
    try {
      await MessageLog.create({
        messageId: message._id,
        senderId: user._id,
        groupId: groupId,
        content: finalContent,
        type: messageType,
        fileUrl: fileUrl || '',
        fileName: fileName || '',
      });
    } catch (logError) {
      console.error('Error creating message log:', logError);
      // Don't fail the request if logging fails
    }

    await message.populate('senderId', 'name email profilePhoto');
    await message.populate('replyTo');
    await message.populate('mentions.userId', 'name email profilePhoto');

    // Emit socket event
    emitGroupEvent(groupId, 'group:message', {
      groupMessage: message.toObject(),
      groupId: groupId.toString(),
    });

    return NextResponse.json({
      message: 'Message sent successfully',
      groupMessage: message,
    });
  } catch (error) {
    console.error('Send group message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

