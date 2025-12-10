import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import User from '../../../../../models/User.js';
import Chat from '../../../../../models/Chat.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find the user by email
    const otherUser = await User.findOne({ email: email.toLowerCase() });

    if (!otherUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (otherUser._id.toString() === user._id.toString()) {
      return NextResponse.json({ error: 'Cannot create chat with yourself' }, { status: 400 });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [user._id, otherUser._id] },
    }).populate('participants', 'name email profilePhoto presenceStatus lastSeen');

    if (chat) {
      return NextResponse.json({
        message: 'Chat already exists',
        chat: {
          _id: chat._id,
          participants: chat.participants,
          lastMessage: chat.lastMessage,
          lastMessageAt: chat.lastMessageAt,
          unreadCount: Object.fromEntries(chat.unreadCount || new Map()),
        },
      });
    }

    // Create new chat
    chat = await Chat.create({
      participants: [user._id, otherUser._id],
      messages: [],
      unreadCount: new Map([[user._id.toString(), 0], [otherUser._id.toString(), 0]]),
    });

    await chat.populate('participants', 'name email profilePhoto presenceStatus lastSeen');

    return NextResponse.json({
      message: 'Chat created successfully',
      chat: {
        _id: chat._id,
        participants: chat.participants,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        unreadCount: Object.fromEntries(chat.unreadCount || new Map()),
      },
    });
  } catch (error) {
    console.error('Create chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
