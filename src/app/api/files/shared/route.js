import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';
import Group from '../../../../../models/Group.js';
import FileModel from '../../../../../models/File.js';
import Message from '../../../../../models/Message.js';

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
    const category = searchParams.get('category'); // images, videos, documents, links, audio

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

    // Get files from messages
    const fileQuery = {
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

    // Filter by category
    if (category === 'images') {
      fileQuery['metadata.type'] = 'image';
    } else if (category === 'videos') {
      fileQuery['metadata.type'] = 'video';
    } else if (category === 'documents') {
      fileQuery['metadata.type'] = 'document';
    } else if (category === 'audio') {
      fileQuery['metadata.type'] = 'audio';
    } else if (category === 'links') {
      // Links are stored in messages, not files
      const linkMessages = await Message.find({
        chatId: chatId || null,
        type: { $in: ['text', 'markdown'] },
        content: { $regex: /https?:\/\//i },
        isDeleted: false,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } },
        ],
      })
        .sort({ createdAt: -1 })
        .populate('senderId', 'name email profilePhoto');

      return NextResponse.json({
        success: true,
        links: linkMessages.map((msg) => ({
          _id: msg._id,
          content: msg.content,
          senderId: msg.senderId,
          createdAt: msg.createdAt,
          url: msg.content.match(/https?:\/\/[^\s]+/i)?.[0] || '',
        })),
      });
    }

    const files = await FileModel.find(fileQuery)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email profilePhoto');

    // Group by type for better organization
    const grouped = {
      images: [],
      videos: [],
      documents: [],
      audio: [],
    };

    files.forEach((file) => {
      const type = file.metadata?.type || 'document';
      if (type === 'image') {
        grouped.images.push(file.toObject());
      } else if (type === 'video') {
        grouped.videos.push(file.toObject());
      } else if (type === 'audio') {
        grouped.audio.push(file.toObject());
      } else {
        grouped.documents.push(file.toObject());
      }
    });

    return NextResponse.json({
      success: true,
      files: category ? grouped[category] || [] : grouped,
    });
  } catch (error) {
    console.error('Get shared media error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

