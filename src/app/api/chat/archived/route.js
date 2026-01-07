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

    // Get all archived chats for the user
    const chats = await Chat.find({
      participants: user._id,
      isArchived: true,
    })
      .populate('participants', 'name email profilePhoto presenceStatus lastSeen privacySettings chatSettings')
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

      // Filter out deleted messages from lastMessage
      let lastMessage = chat.lastMessage;
      if (lastMessage) {
        const isDeletedForEveryone = lastMessage.isDeletedForEveryone || lastMessage.isDeleted;
        const isDeletedForMe = lastMessage.deletedFor?.some(
          (id) => id.toString() === user._id.toString()
        );
        if (isDeletedForEveryone || isDeletedForMe) {
          lastMessage = null;
        }
      }

      // Filter presenceStatus if showOnlineStatus is false
      let filteredOtherUser = otherParticipant;
      if (otherParticipant && otherParticipant.chatSettings) {
        const showOnlineStatus = otherParticipant.chatSettings.showOnlineStatus !== false;
        if (!showOnlineStatus) {
          filteredOtherUser = {
            ...otherParticipant,
            presenceStatus: undefined,
          };
        }
      }

      return {
        _id: chat._id,
        otherUser: filteredOtherUser,
        lastMessage: lastMessage,
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
    console.error('List archived chats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

