import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';
import Group from '../../../../../models/Group.js';
import FileModel from '../../../../../models/File.js';
import Message from '../../../../../models/Message.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Optional sharp import for image processing
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.warn('Sharp not installed, image processing will be limited');
}

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const chatId = formData.get('chatId');
    const groupId = formData.get('groupId');
    const compress = formData.get('compress') === 'true';
    const expiresInDays = formData.get('expiresInDays');

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

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

    // Save file to public/uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const originalFileName = file.name;
    const fileExtension = originalFileName.split('.').pop();
    const fileName = `${timestamp}-${originalFileName}`;
    const filePath = join(uploadsDir, fileName);

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    // Generate thumbnail for images/videos
    let thumbnail = '';
    let width, height;

    if (file.type.startsWith('image/')) {
      if (sharp) {
        try {
          const image = sharp(buffer);
          const metadata = await image.metadata();
          width = metadata.width;
          height = metadata.height;

          if (compress) {
            buffer = await image
              .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 85 })
              .toBuffer();
          }

          // Generate thumbnail
          const thumbnailBuffer = await image
            .resize(200, 200, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();

          const thumbnailFileName = `thumb-${timestamp}-${originalFileName.replace(/\.[^/.]+$/, '.jpg')}`;
          const thumbnailPath = join(uploadsDir, thumbnailFileName);
          await writeFile(thumbnailPath, thumbnailBuffer);
          thumbnail = `/uploads/${thumbnailFileName}`;
        } catch (error) {
          console.error('Error processing image:', error);
        }
      } else {
        // Without sharp, just use the original image
        thumbnail = fileUrl; // Use full image as thumbnail fallback
      }
    } else if (file.type.startsWith('video/')) {
      // For videos, we'd need ffmpeg to generate thumbnails
      // For now, just save the video
      thumbnail = '';
    }

    await writeFile(filePath, buffer);

    // Create file URL
    const fileUrl = `/uploads/${fileName}`;

    // Calculate expiration date
    let expiresAt = null;
    if (expiresInDays) {
      const days = parseInt(expiresInDays, 10);
      if (days > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }
    }

    // Create file record
    const fileRecord = await FileModel.create({
      url: fileUrl,
      thumbnail,
      metadata: {
        size: file.size,
        type: file.type.startsWith('image/') ? 'image' :
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' : 'document',
        name: originalFileName,
        mimeType: file.type,
        width,
        height,
      },
      uploadedBy: user._id,
      chatId: chatId || null,
      groupId: groupId || null,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      file: fileRecord.toObject(),
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

