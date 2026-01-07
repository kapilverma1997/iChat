import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import { verifyAccessToken } from '../../../../../lib/utils.js';

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
    const { notificationSettings, quietHours, notificationSound } = body;

    // Build update object
    const updateData = {};

    // Update notification settings
    if (notificationSettings !== undefined && typeof notificationSettings === 'object') {
      // Build the nested update object
      Object.keys(notificationSettings).forEach((key) => {
        if (notificationSettings[key] !== undefined) {
          updateData[`notificationSettings.${key}`] = notificationSettings[key];
        }
      });
    }

    // Update quiet hours
    if (quietHours !== undefined && typeof quietHours === 'object') {
      Object.keys(quietHours).forEach((key) => {
        if (quietHours[key] !== undefined) {
          updateData[`quietHours.${key}`] = quietHours[key];
        }
      });
    }

    // Update notification sound
    if (notificationSound !== undefined) {
      updateData.notificationSound = notificationSound;
    }

    // Use findByIdAndUpdate with $set operator for reliable nested updates
    const user = await User.findByIdAndUpdate(
      payload.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return updated user data
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.otpSecret;

    return NextResponse.json({
      message: 'Notification settings updated successfully',
      user: userObj,
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}

