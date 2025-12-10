import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import Session from '../../../../../models/Session.js';
import { generateAccessToken, generateRefreshToken } from '../../../../../lib/utils.js';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, phone, otp, type } = body; // type: 'sms' | 'email'

    if (!otp) {
      return NextResponse.json(
        { error: 'OTP is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne(
      type === 'email' ? { email } : { phone }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find valid OTP session
    const otpSession = await Session.findOne({
      userId: user._id,
      token: otp,
      type: 'otp',
      expiresAt: { $gt: new Date() },
    });

    if (!otpSession) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Delete used OTP
    await Session.deleteOne({ _id: otpSession._id });

    // Update user verification status
    if (type === 'email') {
      user.emailVerified = true;
    } else {
      user.phoneVerified = true;
    }
    await user.save();

    // Update presence status
    user.presenceStatus = 'online';
    user.lastSeen = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email });

    // Save refresh token
    await Session.create({
      userId: user._id,
      token: refreshToken,
      type: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Return user data
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.otpSecret;

    return NextResponse.json({
      message: 'OTP verified successfully',
      user: userObj,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
