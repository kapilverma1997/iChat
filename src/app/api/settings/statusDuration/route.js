import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import UserPreferences from '../../../../../models/UserPreferences.js';
import connectDB from '../../../../../lib/mongodb.js';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await UserPreferences.findOne({ user: user._id });
    if (!preferences) {
      preferences = new UserPreferences({ user: user._id });
      await preferences.save();
    }

    return NextResponse.json({
      statusDuration: preferences.statusDuration,
      customStatusDuration: preferences.customStatusDuration,
    });
  } catch (error) {
    console.error('Error fetching status duration:', error);
    return NextResponse.json({ error: 'Failed to fetch status duration' }, { status: 500 });
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
    const { statusDuration, customStatusDuration } = body;

    let preferences = await UserPreferences.findOne({ user: user._id });
    if (!preferences) {
      preferences = new UserPreferences({ user: user._id });
    }

    if (statusDuration !== undefined) preferences.statusDuration = statusDuration;
    if (customStatusDuration !== undefined) preferences.customStatusDuration = customStatusDuration;

    await preferences.save();

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error updating status duration:', error);
    return NextResponse.json({ error: 'Failed to update status duration' }, { status: 500 });
  }
}

