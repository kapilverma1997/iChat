import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import { verifyPassword, generateAccessToken, generateRefreshToken } from '../../../../../lib/utils.js';
import Session from '../../../../../models/Session.js';
import { verifyTOTP } from '../../../../../lib/totp.js';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password, code, deviceId, deviceName, trustDevice } = body;

    // Validation
    if (!email || !password || !code) {
      return NextResponse.json(
        { error: 'Email, password, and verification code are required' },
        { status: 400 }
      );
    }

    // Find user with password and OTP secret
    const user = await User.findOne({ email }).select('+passwordHash +otpSecret +backupCodes');

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password again (for security)
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled || !user.twoFactorType) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      );
    }

    let isValid = false;

    if (user.twoFactorType === 'authenticator') {
      // Verify TOTP
      if (!user.otpSecret) {
        return NextResponse.json(
          { error: 'TOTP secret not found' },
          { status: 400 }
        );
      }
      isValid = verifyTOTP(user.otpSecret, code);
    } else {
      // Verify OTP (SMS/Email) from Session
      const otpSession = await Session.findOne({
        userId: user._id,
        token: code,
        type: 'otp',
        expiresAt: { $gt: new Date() },
      });

      if (otpSession) {
        isValid = true;
        // Delete used OTP session
        await Session.deleteOne({ _id: otpSession._id });
      }

      // Check backup codes if OTP didn't match
      if (!isValid && user.backupCodes) {
        const backupCode = user.backupCodes.find(
          (bc) => !bc.used && bc.code === code
        );
        if (backupCode) {
          isValid = true;
          backupCode.used = true;
          await user.save();
        }
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401 }
      );
    }

    // Trust device if requested
    if (trustDevice && deviceId) {
      if (!user.trustedDevices) {
        user.trustedDevices = [];
      }
      // Check if device is already trusted
      const deviceExists = user.trustedDevices.some(
        (device) => device.deviceId === deviceId
      );
      if (!deviceExists) {
        user.trustedDevices.push({
          deviceId,
          deviceName: deviceName || 'Unknown Device',
          trustedAt: new Date(),
        });
      }
    }

    // Update presence status and last seen
    user.presenceStatus = 'online';
    user.lastSeen = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email });

    // Save refresh token to database
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year for permanent login

    await Session.create({
      userId: user._id,
      token: refreshToken,
      type: 'refresh',
      expiresAt,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Return user data (without password)
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.otpSecret;

    return NextResponse.json({
      message: 'Login successful',
      user: userObj,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Verify login 2FA error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}

