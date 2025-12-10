import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';
import Group from '../../../../../models/Group.js';
import File from '../../../../../models/File.js';

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
    const fileType = searchParams.get('type'); // image, video, document, audio
    const query = searchParams.get('query'); // Search in file names
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    if (!chatId && !groupId) {
      return NextResponse.json(
        { error: 'Chat ID or Group ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access
    if (chatId) {
      const chat = await Chat.findOne({
        _id: chatId,
        participants: user._id,
      });

      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
    } else if (groupId) {
      const group = await Group.findById(groupId);

      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }

      const isMember = group.members.some(
        (m) => m.userId.toString() === user._id.toString()
      );

      if (!isMember) {
        return NextResponse.json(
          { error: 'You are not a member of this group' },
          { status: 403 }
        );
      }
    }

    // Build query
    const fileQuery = {
      isDeleted: false,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    };

    if (chatId) {
      fileQuery.chatId = chatId;
    } else if (groupId) {
      fileQuery.groupId = groupId;
    }

    if (fileType) {
      fileQuery['metadata.type'] = fileType;
    }

    if (query) {
      fileQuery['metadata.name'] = { $regex: query, $options: 'i' };
    }

    const files = await File.find(fileQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name email profilePhoto');

    const total = await File.countDocuments(fileQuery);

    return NextResponse.json({
      success: true,
      files: files.map((f) => f.toObject()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('File search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

