import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';
import Group from '../../../../../models/Group.js';
import Message from '../../../../../models/Message.js';
import { getIO } from '../../../../../lib/socket.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, targetChatId, targetGroupId } = await request.json();

    if (!messageId || (!targetChatId && !targetGroupId)) {
      return NextResponse.json(
        { error: 'Message ID and target chat/group ID are required' },
        { status: 400 }
      );
    }

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify user has access to original message
    const originalChat = await Chat.findOne({
      _id: originalMessage.chatId,
      participants: user._id,
    });

    if (!originalChat) {
      return NextResponse.json(
        { error: 'You do not have access to this message' },
        { status: 403 }
      );
    }

    let targetChat = null;
    let targetGroup = null;
    let targetId = null;
    let roomPrefix = '';

    if (targetChatId) {
      targetChat = await Chat.findOne({
        _id: targetChatId,
        participants: user._id,
      });
      if (!targetChat) {
        return NextResponse.json({ error: 'Target chat not found' }, { status: 404 });
      }
      targetId = targetChatId;
      roomPrefix = 'chat:';
    } else if (targetGroupId) {
      targetGroup = await Group.findOne({
        _id: targetGroupId,
        members: { $elemMatch: { userId: user._id } },
      });
      if (!targetGroup) {
        return NextResponse.json({ error: 'Target group not found' }, { status: 404 });
      }
      targetId = targetGroupId;
      roomPrefix = 'group:';
    }

    // Create forwarded message
    const forwardedMessage = await Message.create({
      chatId: targetChatId || null,
      senderId: user._id,
      content: originalMessage.content,
      type: originalMessage.type,
      fileUrl: originalMessage.fileUrl,
      fileName: originalMessage.fileName,
      fileSize: originalMessage.fileSize,
      metadata: originalMessage.metadata,
      attachments: originalMessage.attachments,
      forwardedFrom: {
        messageId: originalMessage._id,
        chatId: originalMessage.chatId,
      },
      priority: originalMessage.priority,
      tags: originalMessage.tags,
      deliveredAt: new Date(),
    });

    // Update chat/group
    if (targetChat) {
      targetChat.messages.push(forwardedMessage._id);
      targetChat.lastMessage = forwardedMessage._id;
      targetChat.lastMessageAt = new Date();
      targetChat.participants.forEach((participantId) => {
        if (participantId.toString() !== user._id.toString()) {
          const currentCount = targetChat.unreadCount.get(participantId.toString()) || 0;
          targetChat.unreadCount.set(participantId.toString(), currentCount + 1);
        }
      });
      await targetChat.save();
    }

    await forwardedMessage.populate('senderId', 'name email profilePhoto');
    if (forwardedMessage.forwardedFrom?.messageId) {
      await Message.populate(forwardedMessage, {
        path: 'forwardedFrom.messageId',
        select: 'content senderId createdAt',
        populate: { path: 'senderId', select: 'name' },
      });
    }

    // Emit socket event
    try {
      const io = getIO();
      if (io) {
        io.to(`${roomPrefix}${targetId}`).emit('message:forward', {
          message: forwardedMessage.toObject(),
          chatId: targetChatId,
          groupId: targetGroupId,
        });
      }
    } catch (socketError) {
      console.error('Socket error:', socketError);
    }

    return NextResponse.json({
      success: true,
      message: forwardedMessage.toObject(),
    });
  } catch (error) {
    console.error('Forward message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

