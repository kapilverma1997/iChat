import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import { verifyAccessToken, isValidPhone } from '../../../../../lib/utils.js';

export async function PATCH(request) {
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
    const { name, phone, designation, profilePhoto, chatSecurity, twoFactorEnabled, twoFactorType } = body;

    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (name !== undefined) user.name = name;
    if (phone !== undefined) {
      if (phone && !isValidPhone(phone)) {
        return NextResponse.json(
          { error: 'Invalid phone format' },
          { status: 400 }
        );
      }
      user.phone = phone || undefined;
    }
    if (designation !== undefined) user.designation = designation;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    
    // Update chat security settings
    if (chatSecurity !== undefined && typeof chatSecurity === 'object') {
      if (!user.chatSecurity) {
        user.chatSecurity = {};
      }
      if (chatSecurity.screenshotBlocking !== undefined) {
        user.chatSecurity.screenshotBlocking = chatSecurity.screenshotBlocking;
      }
      if (chatSecurity.watermarkEnabled !== undefined) {
        user.chatSecurity.watermarkEnabled = chatSecurity.watermarkEnabled;
      }
      if (chatSecurity.disableCopy !== undefined) {
        user.chatSecurity.disableCopy = chatSecurity.disableCopy;
      }
      if (chatSecurity.disableForward !== undefined) {
        user.chatSecurity.disableForward = chatSecurity.disableForward;
      }
      if (chatSecurity.disableDownload !== undefined) {
        user.chatSecurity.disableDownload = chatSecurity.disableDownload;
      }
    }
    
    // Update 2FA settings
    if (twoFactorEnabled !== undefined) {
      user.twoFactorEnabled = twoFactorEnabled;
    }
    if (twoFactorType !== undefined) {
      user.twoFactorType = twoFactorType || null;
    }

    await user.save();

    // Return updated user data
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.otpSecret;

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: userObj,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
