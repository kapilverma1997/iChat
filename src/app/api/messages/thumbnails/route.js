import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth.js';
import Thumbnail from '../../../../models/Thumbnail.js';
import File from '../../../../models/File.js';
import connectDB from '../../../../lib/mongodb.js';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const messageId = searchParams.get('messageId');

    if (!fileId && !messageId) {
      return NextResponse.json({ error: 'fileId or messageId is required' }, { status: 400 });
    }

    let query = {};
    if (fileId) query.originalFileId = fileId;
    if (messageId) query.messageId = messageId;

    const thumbnail = await Thumbnail.findOne(query);

    if (!thumbnail) {
      return NextResponse.json({ error: 'Thumbnail not found' }, { status: 404 });
    }

    return NextResponse.json({ thumbnail });
  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    return NextResponse.json({ error: 'Failed to fetch thumbnail' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const fileId = formData.get('fileId');
    const messageId = formData.get('messageId');
    const thumbnailFile = formData.get('thumbnail');
    const width = parseInt(formData.get('width') || '200');
    const height = parseInt(formData.get('height') || '200');

    if (!fileId || !thumbnailFile) {
      return NextResponse.json({ error: 'fileId and thumbnail are required' }, { status: 400 });
    }

    // In production, upload thumbnail to cloud storage
    // For now, we'll use a placeholder URL
    const thumbnailUrl = `/thumbnails/${fileId}_${Date.now()}.jpg`;

    const thumbnail = new Thumbnail({
      originalFileId: fileId,
      messageId: messageId || null,
      thumbnailUrl,
      thumbnailSize: { width, height },
      fileSize: thumbnailFile.size || 0,
      format: 'jpg',
    });

    await thumbnail.save();

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`user:${user._id}`).emit('message:thumbnailReady', {
        fileId,
        thumbnailUrl,
        thumbnail,
      });
    }

    return NextResponse.json({ thumbnail }, { status: 201 });
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    return NextResponse.json({ error: 'Failed to create thumbnail' }, { status: 500 });
  }
}

