import { NextResponse } from 'next/server';
// import connectDB from '../../../../../lib/mongodb.js';
import connectDB from '../../../../../lib/mongodb.js';
// import User from '../../../../models/User.js';
// import { verifyAccessToken } from '../../../../lib/utils.js';
import { verifyAccessToken } from '../../../../../lib/utils.js';
import User from '../../../../../models/User.js';

export async function POST(request) {
  try {
    await connectDB();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { presenceStatus } = body;

    if (!presenceStatus || !['online', 'offline', 'away', 'do-not-disturb'].includes(presenceStatus)) {
      return NextResponse.json(
        { error: 'Invalid presence status' },
        { status: 400 }
      );
    }

    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update presence status
    user.presenceStatus = presenceStatus;
    if (presenceStatus === 'online' || presenceStatus === 'away') {
      user.lastSeen = new Date();
    }
    await user.save();

    return NextResponse.json({
      message: 'Presence updated successfully',
      presenceStatus: user.presenceStatus,
      lastSeen: user.lastSeen,
    });
  } catch (error) {
    console.error('Update presence error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update presence' },
      { status: 500 }
    );
  }
}
