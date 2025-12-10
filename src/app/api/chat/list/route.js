import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';
import Message from '../../../../../models/Message.js';

export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all chats for the user
    const chats = await Chat.find({
      participants: user._id,
      isArchived: false,
    })
      .populate('participants', 'name email profilePhoto presenceStatus lastSeen')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();

    // Format chats with other user info
    const formattedChats = chats.map((chat) => {
      const otherParticipant = chat.participants.find(
        (p) => p._id.toString() !== user._id.toString()
      );

      // Handle unreadCount - when using .lean(), it's a plain object, not a Map
      let unreadCount = 0;
      if (chat.unreadCount) {
        try {
          // Check if it's a Map (Mongoose document) or plain object (from .lean())
          if (chat.unreadCount instanceof Map || typeof chat.unreadCount.get === 'function') {
            unreadCount = chat.unreadCount.get(user._id.toString()) || 0;
          } else if (typeof chat.unreadCount === 'object') {
            // It's a plain object from .lean() - Maps become objects with string keys
            const userIdStr = user._id.toString();
            unreadCount = chat.unreadCount[userIdStr] || 0;
          }
        } catch (error) {
          console.error('Error reading unreadCount:', error);
          unreadCount = 0;
        }
      }

      return {
        _id: chat._id,
        otherUser: otherParticipant,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        isPinned: chat.isPinned,
        isMuted: chat.isMuted,
        isArchived: chat.isArchived,
        unreadCount,
        wallpaper: chat.wallpaper,
        createdAt: chat.createdAt,
      };
    });

    return NextResponse.json({ chats: formattedChats });
  } catch (error) {
    console.error('List chats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
