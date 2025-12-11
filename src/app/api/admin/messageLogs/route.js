import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import MessageLog from '../../../../../models/MessageLog.js';

export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const senderId = searchParams.get('senderId');
    const chatId = searchParams.get('chatId');
    const groupId = searchParams.get('groupId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const fileType = searchParams.get('fileType');
    const isFlagged = searchParams.get('isFlagged');
    const search = searchParams.get('search');

    const filter = {};

    if (senderId) {
      filter.senderId = senderId;
    }

    if (chatId) {
      filter.chatId = chatId;
    }

    if (groupId) {
      filter.groupId = groupId;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    if (fileType) {
      filter.type = fileType;
    }

    if (isFlagged !== null && isFlagged !== undefined) {
      filter.isFlagged = isFlagged === 'true';
    }

    if (search) {
      filter.$or = [
        { content: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } },
      ];
    }

    const messageLogs = await MessageLog.find(filter)
      .populate('senderId', 'name email profilePhoto')
      .populate('chatId', 'participants')
      .populate('groupId', 'name')
      .populate('flaggedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await MessageLog.countDocuments(filter);
    const flaggedCount = await MessageLog.countDocuments({ isFlagged: true });

    return NextResponse.json({
      messageLogs,
      page,
      limit,
      total,
      flaggedCount,
      hasMore: total > page * limit,
    });
  } catch (error) {
    console.error('Get message logs error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch message logs' },
      { status: 500 }
    );
  }
}

// Flag a message
export async function POST(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { messageLogId, reason } = await request.json();

    if (!messageLogId) {
      return NextResponse.json(
        { error: 'Message log ID is required' },
        { status: 400 }
      );
    }

    const messageLog = await MessageLog.findByIdAndUpdate(
      messageLogId,
      {
        isFlagged: true,
        flaggedReason: reason || 'Flagged by admin',
        flaggedBy: auth.user._id,
      },
      { new: true }
    );

    if (!messageLog) {
      return NextResponse.json({ error: 'Message log not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Message flagged successfully',
      messageLog,
    });
  } catch (error) {
    console.error('Flag message error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to flag message' },
      { status: 500 }
    );
  }
}

