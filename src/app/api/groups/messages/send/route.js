import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import Group from '../../../../../../models/Group.js';
import GroupMessage from '../../../../../../models/GroupMessage.js';
import MessageLog from '../../../../../../models/MessageLog.js';
import User from '../../../../../../models/User.js';
import { getMemberRole, hasPermission } from '../../../../../../lib/groupPermissions.js';
import { emitGroupEvent } from '../../../../../../lib/socket.js';
import { createNotification } from '../../../../../../lib/notifications.js';

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

    // Validate message type against schema enum
    const validTypes = ['text', 'image', 'video', 'file', 'audio', 'voice', 'location', 'contact', 'poll', 'event', 'system', 'code', 'markdown', 'emoji'];
    if (!validTypes.includes(messageType)) {
      return NextResponse.json({ error: `Invalid message type: ${messageType}` }, { status: 400 });
    }

    // Only require content if it's a text message without a file
    // Code and markdown messages also require content
    if (!messageContent && !['emoji', 'location', 'contact', 'image', 'video', 'file', 'audio', 'voice'].includes(messageType) && !fileUrl) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Code and markdown messages must have content
    if (['code', 'markdown'].includes(messageType) && !messageContent.trim()) {
      return NextResponse.json({ error: 'Content is required for code and markdown messages' }, { status: 400 });
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

    console.log('mentions', mentions);
    // Process mentions
    const processedMentions = [];
    if (mentions && Array.isArray(mentions)) {
      for (const mention of mentions) {
        if (mention.type === 'everyone') {
          // Add all group members for @everyone
          group.members.forEach((member) => {
            // Don't add duplicate userIds
            if (!processedMentions.some(m => m.userId?.toString() === member.userId.toString())) {
              processedMentions.push({
                type: 'user',
                userId: member.userId,
              });
            }
          });
        } else if (mention.type === 'user' && mention.userId) {
          // Validate that the mentioned user is a group member
          const isMember = group.members.some(
            (member) => member.userId.toString() === mention.userId.toString()
          );
          if (isMember) {
            // Don't add duplicate userIds
            if (!processedMentions.some(m => m.userId?.toString() === mention.userId.toString())) {
              processedMentions.push({
                type: 'user',
                userId: mention.userId,
              });
            }
          }
        }
      }
    }

    console.log('processedMentions', processedMentions);

    // Fetch full user data to check watermark settings
    const fullUser = await User.findById(user._id).select('email chatSecurity');
    const watermarkEnabled = fullUser?.chatSecurity?.watermarkEnabled || false;

    // Prepare metadata with watermark if enabled
    let messageMetadata = metadata || {};
    if (watermarkEnabled) {
      const timestamp = new Date().toISOString();
      messageMetadata = {
        ...messageMetadata,
        watermark: {
          email: fullUser.email,
          userId: user._id.toString(),
          timestamp: timestamp,
        },
      };
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
      metadata: messageMetadata,
      mentions: processedMentions,
      replyTo: replyTo || null,
    });

    // Update group last message
    group.lastMessage = message._id;
    group.lastMessageAt = new Date();
    await group.save();

    console.log('message', message);
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

    console.log('message after log', message);
    await message.populate('senderId', 'name email profilePhoto');
    await message.populate({
      path: 'replyTo',
      populate: {
        path: 'senderId',
        select: 'name email profilePhoto'
      }
    });
    await message.populate('mentions.userId', 'name email profilePhoto');

    console.log('message after populate', message);
    const senderName = user.name || 'Someone';
    const groupName = group.name || 'Group';
    const messagePreview = finalContent.length > 50
      ? finalContent.substring(0, 50) + '...'
      : finalContent || (messageType === 'file' || messageType === 'image' || messageType === 'video'
        ? `sent a ${messageType}`
        : 'sent a message');

    console.log('messagePreview', messagePreview);

    // Get unique user IDs from mentions (excluding sender) - used for both mention and general notifications
    const mentionedUserIds = processedMentions.length > 0
      ? [...new Set(
        processedMentions
          .filter(m => m.userId && m.userId.toString() !== user._id.toString())
          .map(m => m.userId.toString())
      )]
      : [];

    // Send notifications to mentioned users (excluding the sender)
    if (mentionedUserIds.length > 0) {
      // Send notification to each mentioned user
      const mentionNotificationPromises = mentionedUserIds.map(userId =>
        createNotification({
          userId,
          type: 'mention',
          category: 'mentions',
          title: `${senderName} mentioned you in ${groupName}`,
          body: messagePreview,
          data: {
            groupId: groupId.toString(),
            messageId: message._id.toString(),
            senderId: user._id.toString(),
            senderName,
            groupName,
            messageContent: finalContent,
            messageType: messageType,
          },
          groupId: groupId.toString(),
          messageId: message._id,
          priority: 'high',
        }).catch(notifError => {
          console.error(`Error sending mention notification to user ${userId}:`, notifError);
          return null;
        })
      );
      await Promise.allSettled(mentionNotificationPromises);
    }

    // Send notifications to all group members (excluding the sender and mentioned users)
    // This ensures all members get toast notifications for new messages
    const senderIdStr = user._id.toString();
    const allMemberIds = group.members
      .map(m => m.userId?.toString())
      .filter(id => id && id !== senderIdStr && !mentionedUserIds.includes(id));

    console.log('allMemberIds', allMemberIds);
    console.log('emitting socket event');
    // Emit socket event
    emitGroupEvent(groupId, 'group:message', {
      groupMessage: message.toObject(),
      groupId: groupId.toString(),
    });

    // Send notifications to all group members in parallel (excluding sender and mentioned users)
    // Using Promise.allSettled to ensure all notifications are attempted even if some fail
    const notificationPromises = allMemberIds.map(userId =>
      createNotification({
        userId,
        type: 'group_message',
        category: 'group_messages',
        title: `${senderName} in ${groupName}`,
        body: messagePreview,
        data: {
          groupId: groupId.toString(),
          messageId: message._id.toString(),
          senderId: senderIdStr,
          senderName,
          groupName,
          messageContent: finalContent,
          messageType: messageType,
        },
        groupId: groupId.toString(),
        messageId: message._id,
        priority: 'normal',
      }).catch(notifError => {
        console.error(`Error sending notification to user ${userId}:`, notifError);
        // Return null to indicate failure, but don't throw
        return null;
      })
    );

    // Wait for all notifications to complete (in parallel)
    await Promise.allSettled(notificationPromises);

    console.log('socket event emitted');

    return NextResponse.json({
      message: 'Message sent successfully',
      groupMessage: message,
    });
  } catch (error) {
    console.error('Send group message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

