import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import User from '../../../../../models/User.js';
import { generateOTP, verifyPassword } from '../../../../../lib/utils.js';
import { sendEmail, getOTPEmailTemplate } from '../../../../../lib/email.js';
import { sendSMS } from '../../../../../lib/sms.js';
import { verifyTOTP } from '../../../../../lib/totp.js';

// Enable 2FA
export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, phone } = await request.json();

    if (!type || !['sms', 'email', 'authenticator'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid 2FA type is required' },
        { status: 400 }
      );
    }

    const userWithSecret = await User.findById(user._id).select('+otpSecret');

    if (type === 'authenticator') {
      // TOTP is already set up via /api/auth/setup-2fa
      userWithSecret.twoFactorEnabled = true;
      userWithSecret.twoFactorType = 'authenticator';
      await userWithSecret.save();

      return NextResponse.json({
        message: '2FA enabled successfully',
      });
    } else if (type === 'email') {
      // Generate OTP and send via email
      const otp = generateOTP(6);
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP temporarily (you might want a separate OTP model)
      userWithSecret.otpSecret = otp;
      userWithSecret.twoFactorType = 'email';
      await userWithSecret.save();

      await sendEmail({
        to: userWithSecret.email,
        subject: 'Your iChat 2FA Verification Code',
        html: getOTPEmailTemplate(otp, userWithSecret.name),
        text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`,
      });

      return NextResponse.json({
        message: 'OTP sent to your email',
      });
    } else if (type === 'sms') {
      if (!phone) {
        return NextResponse.json(
          { error: 'Phone number is required for SMS 2FA' },
          { status: 400 }
        );
      }

      const otp = generateOTP(6);
      userWithSecret.otpSecret = otp;
      userWithSecret.twoFactorType = 'sms';
      userWithSecret.phone = phone;
      await userWithSecret.save();

      await sendSMS(phone, `Your iChat verification code is: ${otp}. Valid for 10 minutes.`);

      return NextResponse.json({
        message: 'OTP sent to your phone',
      });
    }
  } catch (error) {
    console.error('Enable 2FA error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enable 2FA' },
      { status: 500 }
    );
  }
}

// Verify 2FA code
export async function PUT(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, deviceId, deviceName, trustDevice } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    const userWithSecret = await User.findById(user._id).select('+otpSecret +backupCodes');

    // Check if 2FA is enabled OR if we're in the process of enabling it (pending OTP verification)
    const isEnabling2FA = !userWithSecret.twoFactorEnabled &&
      userWithSecret.twoFactorType &&
      userWithSecret.otpSecret;

    if (!userWithSecret.twoFactorEnabled && !isEnabling2FA) {
      return NextResponse.json(
        { error: '2FA is not enabled' },
        { status: 400 }
      );
    }

    let isValid = false;

    if (userWithSecret.twoFactorType === 'authenticator') {
      // Verify TOTP
      isValid = verifyTOTP(userWithSecret.otpSecret, code);
    } else {
      // Verify OTP (SMS/Email)
      isValid = userWithSecret.otpSecret === code;
    }

    // Check backup codes
    if (!isValid && userWithSecret.backupCodes) {
      const backupCode = userWithSecret.backupCodes.find(
        (bc) => !bc.used && bc.code === code
      );
      if (backupCode) {
        isValid = true;
        backupCode.used = true;
        await userWithSecret.save();
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
      if (!userWithSecret.trustedDevices) {
        userWithSecret.trustedDevices = [];
      }
      userWithSecret.trustedDevices.push({
        deviceId,
        deviceName: deviceName || 'Unknown Device',
        trustedAt: new Date(),
      });
    }

    // Enable 2FA if we're in the process of enabling it
    if (isEnabling2FA) {
      userWithSecret.twoFactorEnabled = true;
    }

    // Clear OTP after successful verification
    if (userWithSecret.twoFactorType !== 'authenticator') {
      userWithSecret.otpSecret = undefined;
    }

    await userWithSecret.save();

    return NextResponse.json({
      message: '2FA verified successfully',
      trusted: !!trustDevice,
    });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify 2FA' },
      { status: 500 }
    );
  }
}

// Generate backup codes
export async function PATCH(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithCodes = await User.findById(user._id).select('+backupCodes');

    // Generate 10 backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = generateOTP(8);
      backupCodes.push({
        code,
        used: false,
      });
    }

    userWithCodes.backupCodes = backupCodes;
    await userWithCodes.save();

    return NextResponse.json({
      backupCodes: backupCodes.map((bc) => bc.code),
      message: 'Backup codes generated. Save them securely!',
    });
  } catch (error) {
    console.error('Generate backup codes error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate backup codes' },
      { status: 500 }
    );
  }
}

// Disable 2FA
export async function DELETE(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to disable 2FA' },
        { status: 400 }
      );
    }

    const userWithPassword = await User.findById(user._id).select('+passwordHash');
    const isValidPassword = await verifyPassword(password, userWithPassword.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    userWithPassword.twoFactorEnabled = false;
    userWithPassword.twoFactorType = undefined;
    userWithPassword.otpSecret = undefined;
    userWithPassword.backupCodes = [];
    await userWithPassword.save();

    return NextResponse.json({
      message: '2FA disabled successfully',
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}

