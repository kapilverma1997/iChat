import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth.js';
import LanguagePreferences from '../../../../models/LanguagePreferences.js';
import User from '../../../../models/User.js';
import { getIO } from '../../../../lib/socket.js';
import connectDB from '../../../../lib/mongodb.js';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await LanguagePreferences.findOne({ user: user._id });
    if (!preferences) {
      preferences = new LanguagePreferences({
        user: user._id,
        language: user.language || 'en',
        autoDetect: true,
      });
      await preferences.save();
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching language preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch language preferences' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { language, autoDetect, rtlEnabled, dateFormat, timeFormat, timezone } = body;

    let preferences = await LanguagePreferences.findOne({ user: user._id });
    if (!preferences) {
      preferences = new LanguagePreferences({ user: user._id });
    }

    if (language !== undefined) {
      preferences.language = language;
      // Update user model as well
      await User.findByIdAndUpdate(user._id, { language });
    }
    if (autoDetect !== undefined) preferences.autoDetect = autoDetect;
    if (rtlEnabled !== undefined) preferences.rtlEnabled = rtlEnabled;
    if (dateFormat !== undefined) preferences.dateFormat = dateFormat;
    if (timeFormat !== undefined) preferences.timeFormat = timeFormat;
    if (timezone !== undefined) preferences.timezone = timezone;

    await preferences.save();

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`user:${user._id}`).emit('language:changed', {
        preferences,
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error updating language preferences:', error);
    return NextResponse.json({ error: 'Failed to update language preferences' }, { status: 500 });
  }
}

