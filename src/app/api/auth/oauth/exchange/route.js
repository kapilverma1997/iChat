import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../[...nextauth]/route.js';
import connectDB from '../../../../../../lib/mongodb.js';
import User from '../../../../../../models/User.js';
import Session from '../../../../../../models/Session.js';
import { generateAccessToken, generateRefreshToken } from '../../../../../../lib/utils.js';

export async function POST(request) {
  try {
    await connectDB();

    // Get session from NextAuth
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user presence
    user.presenceStatus = 'online';
    user.lastSeen = new Date();
    await user.save();

    // Generate JWT tokens compatible with existing system
    const accessToken = generateAccessToken({ 
      userId: user._id.toString(), 
      email: user.email 
    });
    const refreshToken = generateRefreshToken({ 
      userId: user._id.toString(), 
      email: user.email 
    });

    // Save refresh token to database
    await Session.create({
      userId: user._id,
      token: refreshToken,
      type: 'refresh',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year for permanent login
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Return user data (without password)
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.otpSecret;

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: userObj,
    });
  } catch (error) {
    console.error('OAuth exchange error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to exchange session' },
      { status: 500 }
    );
  }
}

