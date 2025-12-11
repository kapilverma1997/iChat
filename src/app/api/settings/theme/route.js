import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth.js';
import UserPreferences from '../../../../models/UserPreferences.js';
import { getIO } from '../../../../lib/socket.js';
import connectDB from '../../../../lib/mongodb.js';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await UserPreferences.findOne({ user: user._id });
    if (!preferences) {
      preferences = new UserPreferences({
        user: user._id,
        theme: user.theme || 'light',
      });
      await preferences.save();
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching theme preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch theme preferences' }, { status: 500 });
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
    const { theme, customTheme } = body;

    let preferences = await UserPreferences.findOne({ user: user._id });
    if (!preferences) {
      preferences = new UserPreferences({ user: user._id });
    }

    if (theme !== undefined) preferences.theme = theme;
    if (customTheme !== undefined) preferences.customTheme = customTheme;

    await preferences.save();

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`user:${user._id}`).emit('theme:changed', {
        theme,
        customTheme,
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error updating theme:', error);
    return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
  }
}

