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

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const groupId = searchParams.get('groupId');

    let preferences = await UserPreferences.findOne({ user: user._id });
    if (!preferences) {
      preferences = new UserPreferences({ user: user._id });
      await preferences.save();
    }

    let background = preferences.defaultChatBackground;
    if (chatId || groupId) {
      const chatBackground = preferences.chatBackgrounds.find(
        (bg) => (chatId && bg.chatId?.toString() === chatId) || (groupId && bg.groupId?.toString() === groupId)
      );
      if (chatBackground) {
        background = chatBackground.backgroundUrl;
      }
    }

    return NextResponse.json({ background, defaultBackground: preferences.defaultChatBackground });
  } catch (error) {
    console.error('Error fetching background:', error);
    return NextResponse.json({ error: 'Failed to fetch background' }, { status: 500 });
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
    const { backgroundUrl, chatId, groupId, backgroundType, isDefault } = body;

    let preferences = await UserPreferences.findOne({ user: user._id });
    if (!preferences) {
      preferences = new UserPreferences({ user: user._id });
    }

    if (isDefault) {
      preferences.defaultChatBackground = backgroundUrl;
    } else if (chatId || groupId) {
      const existingIndex = preferences.chatBackgrounds.findIndex(
        (bg) => (chatId && bg.chatId?.toString() === chatId) || (groupId && bg.groupId?.toString() === groupId)
      );

      const backgroundData = {
        chatId: chatId || null,
        groupId: groupId || null,
        backgroundUrl,
        backgroundType: backgroundType || 'predefined',
      };

      if (existingIndex >= 0) {
        preferences.chatBackgrounds[existingIndex] = backgroundData;
      } else {
        preferences.chatBackgrounds.push(backgroundData);
      }
    }

    await preferences.save();

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error updating background:', error);
    return NextResponse.json({ error: 'Failed to update background' }, { status: 500 });
  }
}

