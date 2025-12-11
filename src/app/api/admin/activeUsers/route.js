import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import ActiveUser from '../../../../../models/ActiveUser.js';
import User from '../../../../../models/User.js';

export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const isOnline = searchParams.get('isOnline');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filter = {};
    if (isOnline !== null && isOnline !== undefined) {
      filter.isOnline = isOnline === 'true';
    }

    const activeUsers = await ActiveUser.find(filter)
      .populate('userId', 'name email profilePhoto')
      .populate('currentChatId', 'participants')
      .populate('currentGroupId', 'name')
      .sort({ lastActivityAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await ActiveUser.countDocuments(filter);
    const onlineCount = await ActiveUser.countDocuments({ isOnline: true });

    return NextResponse.json({
      activeUsers,
      page,
      limit,
      total,
      onlineCount,
      hasMore: total > page * limit,
    });
  } catch (error) {
    console.error('Get active users error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch active users' },
      { status: 500 }
    );
  }
}

