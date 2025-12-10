import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import { verifyTOTP } from '../../../../../lib/totp.js';
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

    const body = await request.json();
    const { totpToken } = body;

    if (!totpToken) {
      return NextResponse.json(
        { error: 'TOTP token is required' },
        { status: 400 }
      );
    }

    const user = await User.findById(payload.userId).select('+otpSecret');

    if (!user || !user.otpSecret) {
      return NextResponse.json(
        { error: 'TOTP secret not found. Please setup TOTP first' },
        { status: 400 }
      );
    }

    // Verify TOTP token
    const isValid = verifyTOTP(totpToken, user.otpSecret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid TOTP token' },
        { status: 400 }
      );
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorType = 'authenticator';
    await user.save();

    return NextResponse.json({
      message: 'Two-factor authentication enabled successfully',
    });
  } catch (error) {
    console.error('Enable TOTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enable TOTP' },
      { status: 500 }
    );
  }
}
