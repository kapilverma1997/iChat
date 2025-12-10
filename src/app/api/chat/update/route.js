import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';

export async function PATCH(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, isPinned, isMuted, isArchived, wallpaper, unreadCount } = await request.json();

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      participants: user._id,
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Update fields
    if (isPinned !== undefined) chat.isPinned = isPinned;
    if (isMuted !== undefined) chat.isMuted = isMuted;
    if (isArchived !== undefined) chat.isArchived = isArchived;
    if (wallpaper !== undefined) chat.wallpaper = wallpaper;
    if (unreadCount !== undefined) {
      chat.unreadCount.set(user._id.toString(), unreadCount);
    }

    await chat.save();

    return NextResponse.json({
      message: 'Chat updated successfully',
      chat: {
        _id: chat._id,
        isPinned: chat.isPinned,
        isMuted: chat.isMuted,
        isArchived: chat.isArchived,
        wallpaper: chat.wallpaper,
        unreadCount: chat.unreadCount.get(user._id.toString()) || 0,
      },
    });
  } catch (error) {
    console.error('Update chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
