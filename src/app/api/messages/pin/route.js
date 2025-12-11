import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth.js';
import PinnedMessage from '../../../../models/PinnedMessage.js';
import Message from '../../../../models/Message.js';
import { getIO } from '../../../../lib/socket.js';
import connectDB from '../../../../lib/mongodb.js';

export async function POST(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, chatId, groupId, note } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Check if message exists
    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if already pinned
    const existingPin = await PinnedMessage.findOne({ messageId });
    if (existingPin) {
      return NextResponse.json({ error: 'Message is already pinned' }, { status: 400 });
    }

    // Get the highest order number
    const maxOrder = await PinnedMessage.findOne(
      { chatId: chatId || null, groupId: groupId || null }
    ).sort({ order: -1 });

    const pinnedMessage = new PinnedMessage({
      messageId,
      chatId: chatId || null,
      groupId: groupId || null,
      pinnedBy: user._id,
      order: maxOrder ? maxOrder.order + 1 : 0,
      note: note || '',
    });

    await pinnedMessage.save();

    // Emit socket event
    const io = getIO();
    if (io) {
      const room = chatId ? `chat:${chatId}` : `group:${groupId}`;
      io.to(room).emit('message:pinned', {
        action: 'pinned',
        pinnedMessage: await PinnedMessage.findById(pinnedMessage._id)
          .populate('messageId')
          .populate('pinnedBy', 'name email profilePhoto'),
      });
    }

    return NextResponse.json({ pinnedMessage }, { status: 201 });
  } catch (error) {
    console.error('Error pinning message:', error);
    return NextResponse.json({ error: 'Failed to pin message' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pinnedMessageId = searchParams.get('pinnedMessageId');

    if (!pinnedMessageId) {
      return NextResponse.json({ error: 'Pinned message ID is required' }, { status: 400 });
    }

    const pinnedMessage = await PinnedMessage.findById(pinnedMessageId);
    if (!pinnedMessage) {
      return NextResponse.json({ error: 'Pinned message not found' }, { status: 404 });
    }

    const chatId = pinnedMessage.chatId;
    const groupId = pinnedMessage.groupId;

    await PinnedMessage.findByIdAndDelete(pinnedMessageId);

    // Emit socket event
    const io = getIO();
    if (io) {
      const room = chatId ? `chat:${chatId}` : `group:${groupId}`;
      io.to(room).emit('message:pinned', {
        action: 'unpinned',
        pinnedMessageId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unpinning message:', error);
    return NextResponse.json({ error: 'Failed to unpin message' }, { status: 500 });
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

    const pinnedMessages = await PinnedMessage.find({
      chatId: chatId || null,
      groupId: groupId || null,
    })
      .populate('messageId')
      .populate('pinnedBy', 'name email profilePhoto')
      .sort({ order: 1, pinnedAt: -1 });

    return NextResponse.json({ pinnedMessages });
  } catch (error) {
    console.error('Error fetching pinned messages:', error);
    return NextResponse.json({ error: 'Failed to fetch pinned messages' }, { status: 500 });
  }
}

