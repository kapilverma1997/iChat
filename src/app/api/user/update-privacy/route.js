import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import User from '../../../../models/User.js';
import { verifyAccessToken } from '../../../../lib/utils.js';

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
    const { privacySettings } = body;

    if (!privacySettings || typeof privacySettings !== 'object') {
      return NextResponse.json(
        { error: 'Privacy settings object is required' },
        { status: 400 }
      );
    }

    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update privacy settings
    if (privacySettings.showProfilePhoto !== undefined) {
      user.privacySettings.showProfilePhoto = privacySettings.showProfilePhoto;
    }
    if (privacySettings.showLastSeen !== undefined) {
      user.privacySettings.showLastSeen = privacySettings.showLastSeen;
    }
    if (privacySettings.showStatus !== undefined) {
      user.privacySettings.showStatus = privacySettings.showStatus;
    }
    if (privacySettings.showDesignation !== undefined) {
      user.privacySettings.showDesignation = privacySettings.showDesignation;
    }

    await user.save();

    // Return updated user data
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.otpSecret;

    return NextResponse.json({
      message: 'Privacy settings updated successfully',
      user: userObj,
    });
  } catch (error) {
    console.error('Update privacy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
}
