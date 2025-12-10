import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import { verifyAccessToken } from '../../../../../lib/utils.js';

export async function PATCH(request) {
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
    const { presenceStatus, statusMessage } = body;

    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update presence status
    if (presenceStatus !== undefined) {
      if (!['online', 'offline', 'away', 'do-not-disturb'].includes(presenceStatus)) {
        return NextResponse.json(
          { error: 'Invalid presence status' },
          { status: 400 }
        );
      }
      user.presenceStatus = presenceStatus;
      if (presenceStatus === 'online' || presenceStatus === 'away') {
        user.lastSeen = new Date();
      }
    }

    // Update status message
    if (statusMessage !== undefined) {
      if (statusMessage.length > 100) {
        return NextResponse.json(
          { error: 'Status message cannot exceed 100 characters' },
          { status: 400 }
        );
      }
      user.statusMessage = statusMessage;
    }

    await user.save();

    // Return updated user data
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.otpSecret;

    return NextResponse.json({
      message: 'Status updated successfully',
      user: userObj,
    });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update status' },
      { status: 500 }
    );
  }
}
