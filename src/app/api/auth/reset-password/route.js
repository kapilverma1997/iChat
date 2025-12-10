import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import Session from '../../../../../models/Session.js';
import { hashPassword, generateOTP, isValidEmail } from '../../../../../lib/utils.js';
import { sendEmail, getPasswordResetEmailTemplate } from '../../../../../lib/email.js';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, resetToken, newPassword, action } = body; // action: 'request' | 'reset'

    if (action === 'request') {
      // Request password reset
      if (!email || !isValidEmail(email)) {
        return NextResponse.json(
          { error: 'Valid email is required' },
          { status: 400 }
        );
      }

      const user = await User.findOne({ email });

      if (!user) {
        // Don't reveal if user exists for security
        return NextResponse.json({
          message: 'If the email exists, a password reset link has been sent',
        });
      }

      // Generate reset token
      const token = generateOTP(32);
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

      // Save reset token (expires in 1 hour)
      await Session.create({
        userId: user._id,
        token,
        type: 'reset',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      // Send reset email
      await sendEmail({
        to: email,
        subject: 'Reset Your iChat Password',
        html: getPasswordResetEmailTemplate(resetLink, user.name),
      });

      return NextResponse.json({
        message: 'If the email exists, a password reset link has been sent',
      });
    } else if (action === 'reset') {
      // Reset password
      if (!resetToken || !newPassword) {
        return NextResponse.json(
          { error: 'Reset token and new password are required' },
          { status: 400 }
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      // Find valid reset token
      const resetSession = await Session.findOne({
        token: resetToken,
        type: 'reset',
        expiresAt: { $gt: new Date() },
      });

      if (!resetSession) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        );
      }

      // Update password
      const user = await User.findById(resetSession.userId).select('+passwordHash');
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      user.passwordHash = await hashPassword(newPassword);
      await user.save();

      // Delete reset token
      await Session.deleteOne({ _id: resetSession._id });

      // Delete all refresh tokens (force re-login)
      await Session.deleteMany({
        userId: user._id,
        type: 'refresh',
      });

      return NextResponse.json({
        message: 'Password reset successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "request" or "reset"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: error.message || 'Password reset failed' },
      { status: 500 }
    );
  }
}
