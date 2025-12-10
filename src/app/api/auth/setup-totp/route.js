import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import { generateTOTPSecret, generateQRCode } from '../../../../../lib/totp.js';
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

    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate TOTP secret
    const totpSecret = generateTOTPSecret(user.email, 'iChat');
    const qrCodeUrl = await generateQRCode(totpSecret.qrCodeUrl);

    // Save secret temporarily (don't enable 2FA yet - user needs to verify first)
    user.otpSecret = totpSecret.secret;
    await user.save();

    return NextResponse.json({
      secret: totpSecret.secret,
      qrCodeUrl,
      message: 'Scan the QR code with your authenticator app',
    });
  } catch (error) {
    console.error('Setup TOTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to setup TOTP' },
      { status: 500 }
    );
  }
}
