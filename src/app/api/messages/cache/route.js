import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth.js';
import CachedMessage from '../../../../models/CachedMessage.js';
import Message from '../../../../models/Message.js';
import connectDB from '../../../../lib/mongodb.js';

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
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');

    let query = { user: user._id };
    if (chatId) query.chatId = chatId;
    if (groupId) query.groupId = groupId;
    if (cursor) query.cachedAt = { $lt: new Date(cursor) };

    const cachedMessages = await CachedMessage.find(query)
      .sort({ cachedAt: -1 })
      .limit(limit)
      .populate('messageId', 'content sender type createdAt');

    // Update access count
    const messageIds = cachedMessages.map((cm) => cm._id);
    await CachedMessage.updateMany(
      { _id: { $in: messageIds } },
      {
        $inc: { accessCount: 1 },
        $set: { lastAccessed: new Date() },
      }
    );

    return NextResponse.json({
      messages: cachedMessages.map((cm) => ({
        ...cm.messageData,
        cachedAt: cm.cachedAt,
      })),
      nextCursor: cachedMessages.length === limit
        ? cachedMessages[cachedMessages.length - 1].cachedAt.toISOString()
        : null,
    });
  } catch (error) {
    console.error('Error fetching cached messages:', error);
    return NextResponse.json({ error: 'Failed to fetch cached messages' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messages, chatId, groupId, storageType } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Cache messages
    const cachePromises = messages.map((message) => {
      return CachedMessage.findOneAndUpdate(
        {
          user: user._id,
          messageId: message._id || message.id,
          chatId: chatId || null,
          groupId: groupId || null,
        },
        {
          user: user._id,
          messageId: message._id || message.id,
          chatId: chatId || null,
          groupId: groupId || null,
          messageData: message,
          storageType: storageType || 'memory',
          lastAccessed: new Date(),
          $inc: { accessCount: 1 },
        },
        { upsert: true, new: true }
      );
    });

    await Promise.all(cachePromises);

    return NextResponse.json({ success: true, cached: messages.length });
  } catch (error) {
    console.error('Error caching messages:', error);
    return NextResponse.json({ error: 'Failed to cache messages' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const groupId = searchParams.get('groupId');

    let query = { user: user._id };
    if (chatId) query.chatId = chatId;
    if (groupId) query.groupId = groupId;

    await CachedMessage.deleteMany(query);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}

