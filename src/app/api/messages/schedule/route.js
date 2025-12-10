import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';
import Group from '../../../../../models/Group.js';
import ScheduledMessage from '../../../../../models/ScheduledMessage.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      content,
      type = 'text',
      fileUrl,
      fileName,
      fileSize,
      metadata,
      sendAt,
      targetChatId,
      targetGroupId,
      priority = 'normal',
      tags = [],
    } = await request.json();

    if (!content || !sendAt || (!targetChatId && !targetGroupId)) {
      return NextResponse.json(
        { error: 'Content, sendAt, and target chat/group are required' },
        { status: 400 }
      );
    }

    // Verify sendAt is in the future
    const sendDate = new Date(sendAt);
    if (sendDate <= new Date()) {
      return NextResponse.json(
        { error: 'Send date must be in the future' },
        { status: 400 }
      );
    }

    // Verify user has access to target chat/group
    if (targetChatId) {
      const chat = await Chat.findOne({
        _id: targetChatId,
        participants: user._id,
      });
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
    } else if (targetGroupId) {
      const group = await Group.findOne({
        _id: targetGroupId,
        members: { $elemMatch: { userId: user._id } },
      });
      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }
    }

    // Create scheduled message
    const scheduledMessage = await ScheduledMessage.create({
      message: {
        content,
        type,
        fileUrl,
        fileName,
        fileSize,
        metadata,
        priority,
        tags,
      },
      sendAt: sendDate,
      targetChat: targetChatId || null,
      targetGroup: targetGroupId || null,
      senderId: user._id,
    });

    return NextResponse.json({
      success: true,
      scheduledMessage: scheduledMessage.toObject(),
    });
  } catch (error) {
    console.error('Schedule message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const groupId = searchParams.get('groupId');

    const query = { senderId: user._id, isSent: false };
    if (chatId) query.targetChat = chatId;
    if (groupId) query.targetGroup = groupId;

    const scheduledMessages = await ScheduledMessage.find(query)
      .sort({ sendAt: 1 })
      .populate('targetChat', 'participants')
      .populate('targetGroup', 'name');

    return NextResponse.json({
      success: true,
      scheduledMessages: scheduledMessages.map((sm) => sm.toObject()),
    });
  } catch (error) {
    console.error('Get scheduled messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

