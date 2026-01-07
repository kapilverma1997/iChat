import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import { verifyPassword, generateAccessToken, generateRefreshToken, isValidEmail, generateOTP } from '../../../../../lib/utils.js';
import Session from '../../../../../models/Session.js';
import { sendEmail, getOTPEmailTemplate } from '../../../../../lib/email.js';
import { sendSMS } from '../../../../../lib/sms.js';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password, rememberMe } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled && user.twoFactorType) {
      // Generate OTP for email/SMS or require TOTP for authenticator
      if (user.twoFactorType === 'email') {
        // Generate OTP and send via email
        const otp = generateOTP(6);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in Session
        await Session.create({
          userId: user._id,
          token: otp,
          type: 'otp',
          expiresAt: otpExpiry,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });

        // Send OTP via email
        await sendEmail({
          to: user.email,
          subject: 'Your iChat Login Verification Code',
          html: getOTPEmailTemplate(otp, user.name),
          text: `Your login verification code is: ${otp}. It will expire in 10 minutes.`,
        });

        return NextResponse.json({
          message: '2FA verification required',
          requires2FA: true,
          twoFactorType: 'email',
        }, { status: 200 });
      } else if (user.twoFactorType === 'sms') {
        if (!user.phone) {
          return NextResponse.json(
            { error: 'Phone number not found for SMS 2FA' },
            { status: 400 }
          );
        }

        // Generate OTP and send via SMS
        const otp = generateOTP(6);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in Session
        await Session.create({
          userId: user._id,
          token: otp,
          type: 'otp',
          expiresAt: otpExpiry,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });

        // Send OTP via SMS
        await sendSMS({
          to: user.phone,
          message: `Your iChat login verification code is: ${otp}. Valid for 10 minutes.`,
        });

        return NextResponse.json({
          message: '2FA verification required',
          requires2FA: true,
          twoFactorType: 'sms',
        }, { status: 200 });
      } else if (user.twoFactorType === 'authenticator') {
        // For authenticator, just indicate that TOTP code is required
        return NextResponse.json({
          message: '2FA verification required',
          requires2FA: true,
          twoFactorType: 'authenticator',
        }, { status: 200 });
      }
    }

    // No 2FA enabled, proceed with normal login
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
