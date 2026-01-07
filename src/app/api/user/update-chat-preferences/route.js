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
    const { chatSettings, mediaSettings, messageHistorySettings, displaySettings } = body;

    // Build update object
    const updateData = {};

    // Update chat settings
    if (chatSettings !== undefined && typeof chatSettings === 'object') {
      Object.keys(chatSettings).forEach((key) => {
        // Explicitly check for undefined to allow false values to be saved
        if (chatSettings[key] !== undefined) {
          updateData[`chatSettings.${key}`] = chatSettings[key];
        }
      });
    }

    // Update media settings
    if (mediaSettings !== undefined && typeof mediaSettings === 'object') {
      Object.keys(mediaSettings).forEach((key) => {
        if (mediaSettings[key] !== undefined) {
          updateData[`mediaSettings.${key}`] = mediaSettings[key];
        }
      });
    }

    // Update message history settings
    if (messageHistorySettings !== undefined && typeof messageHistorySettings === 'object') {
      Object.keys(messageHistorySettings).forEach((key) => {
        if (messageHistorySettings[key] !== undefined) {
          updateData[`messageHistorySettings.${key}`] = messageHistorySettings[key];
        }
      });
    }

    // Update display settings
    if (displaySettings !== undefined && typeof displaySettings === 'object') {
      Object.keys(displaySettings).forEach((key) => {
        if (displaySettings[key] !== undefined) {
          updateData[`displaySettings.${key}`] = displaySettings[key];
        }
      });
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
      message: 'Chat preferences updated successfully',
      user: userObj,
    });
  } catch (error) {
    console.error('Update chat preferences error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update chat preferences' },
      { status: 500 }
    );
  }
}

