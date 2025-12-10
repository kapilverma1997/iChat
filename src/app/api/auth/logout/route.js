import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import Session from '../../../../../models/Session.js';
import User from '../../../../../models/User.js';
import { verifyAccessToken } from '../../../../../lib/utils.js';

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

    // Delete all refresh tokens for this user
    await Session.deleteMany({
      userId: payload.userId,
      type: 'refresh',
    });

    // Update user presence to offline
    await User.findByIdAndUpdate(payload.userId, {
      presenceStatus: 'offline',
      lastSeen: new Date(),
    });

    return NextResponse.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
