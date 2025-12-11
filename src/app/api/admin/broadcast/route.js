import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import BroadcastChannel from '../../../../../models/BroadcastChannel.js';
import BroadcastMessage from '../../../../../models/BroadcastMessage.js';
import { createNotification } from '../../../../../lib/notifications.js';
import { getIO } from '../../../../../lib/socket.js';

// Get all broadcast channels
export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    if (channelId) {
      // Get channel with messages
      const channel = await BroadcastChannel.findById(channelId)
        .populate('subscribers.userId', 'name email')
        .populate('createdBy', 'name email')
        .lean();

      const messages = await BroadcastMessage.find({ channelId })
        .populate('senderId', 'name email profilePhoto')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      return NextResponse.json({
        channel,
        messages,
      });
    }

    // Get all channels
    const channels = await BroadcastChannel.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      channels,
    });
  } catch (error) {
    console.error('Get broadcast channels error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch broadcast channels' },
      { status: 500 }
    );
  }
}

// Create broadcast channel
export async function POST(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { name, description, logo, subscribers, settings } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      );
    }

    const channel = await BroadcastChannel.create({
      name,
      description,
      logo,
      subscribers: subscribers || [],
      settings: settings || {
        allowComments: false,
        requireApproval: false,
      },
      createdBy: auth.user._id,
      isActive: true,
    });

    return NextResponse.json({
      message: 'Broadcast channel created successfully',
      channel,
    });
  } catch (error) {
    console.error('Create broadcast channel error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create broadcast channel' },
      { status: 500 }
    );
  }
}

// Send broadcast message
export async function PUT(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { channelId, content, attachments, priority } = await request.json();

    if (!channelId || !content) {
      return NextResponse.json(
        { error: 'Channel ID and content are required' },
        { status: 400 }
      );
    }

    const channel = await BroadcastChannel.findById(channelId);
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Create broadcast message
    const message = await BroadcastMessage.create({
      channelId,
      senderId: auth.user._id,
      content,
      attachments: attachments || [],
      priority: priority || 'normal',
    });

    // Send notifications to all subscribers
    const io = getIO();
    for (const subscriber of channel.subscribers) {
      if (!subscriber.isMuted) {
        await createNotification({
          userId: subscriber.userId,
          type: 'system',
          category: 'system',
          title: `New broadcast: ${channel.name}`,
          body: content.substring(0, 100),
          data: {
            channelId: channel._id.toString(),
            messageId: message._id.toString(),
          },
          priority,
        });

        if (io) {
          io.to(`user:${subscriber.userId}`).emit('broadcast:new', {
            channel: channel.toObject(),
            message: message.toObject(),
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Broadcast message sent successfully',
      broadcastMessage: message,
    });
  } catch (error) {
    console.error('Send broadcast message error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send broadcast message' },
      { status: 500 }
    );
  }
}

