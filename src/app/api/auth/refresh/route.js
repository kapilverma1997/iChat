import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import Session from '../../../../models/Session.js';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../../../../lib/utils.js';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Check if refresh token exists in database
    const session = await Session.findOne({
      userId: payload.userId,
      token: refreshToken,
      type: 'refresh',
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Refresh token not found or expired' },
        { status: 401 }
      );
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({ userId: payload.userId, email: payload.email });
    const newRefreshToken = generateRefreshToken({ userId: payload.userId, email: payload.email });

    // Update refresh token in database
    session.token = newRefreshToken;
    session.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year for permanent login
    await session.save();

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
