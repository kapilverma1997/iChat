import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import Session from '../../../../../models/Session.js';
import { generateOTP, isValidEmail, isValidPhone } from '../../../../../lib/utils.js';
import { sendEmail, getOTPEmailTemplate } from '../../../../../lib/email.js';
import { sendSMS, getOTPSMSMessage } from '../../../../../lib/sms.js';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, phone, type } = body; // type: 'sms' | 'email'

    if (!type || !['sms', 'email'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid OTP type. Must be "sms" or "email"' },
        { status: 400 }
      );
    }

    if (type === 'email' && (!email || !isValidEmail(email))) {
      return NextResponse.json(
        { error: 'Valid email is required for email OTP' },
        { status: 400 }
      );
    }

    if (type === 'sms' && (!phone || !isValidPhone(phone))) {
      return NextResponse.json(
        { error: 'Valid phone number is required for SMS OTP' },
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

    // Generate OTP
    const otp = generateOTP(6);

    // Save OTP to database (expires in 10 minutes)
    await Session.create({
      userId: user._id,
      token: otp,
      type: 'otp',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Send OTP
    if (type === 'email') {
      await sendEmail({
        to: email,
        subject: 'Your iChat Verification Code',
        html: getOTPEmailTemplate(otp, user.name),
      });
    } else {
      await sendSMS({
        to: phone,
        message: getOTPSMSMessage(otp),
      });
    }

    return NextResponse.json({
      message: `OTP sent to your ${type === 'email' ? 'email' : 'phone'}`,
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
