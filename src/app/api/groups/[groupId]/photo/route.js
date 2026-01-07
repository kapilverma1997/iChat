import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import Group from '../../../../../../models/Group.js';
import { getMemberRole, hasPermission } from '../../../../../../lib/groupPermissions.js';
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

export async function POST(request, { params }) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // Check permissions
    if (!hasPermission(userRole, 'canChangeGroupInfo')) {
      return NextResponse.json(
        { error: 'You do not have permission to change group photo' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for group photos)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Image size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Save file to public/uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const originalFileName = file.name;
    const fileExtension = originalFileName.split('.').pop();
    const fileName = `group-photo-${groupId}-${timestamp}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    // Process image with sharp if available (resize and optimize)
    if (sharp) {
      try {
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Resize to max 800x800 while maintaining aspect ratio
        buffer = await image
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();

        // Update file extension to .jpg if converted
        const jpgFileName = `group-photo-${groupId}-${timestamp}.jpg`;
        const jpgFilePath = join(uploadsDir, jpgFileName);
        await writeFile(jpgFilePath, buffer);
        
        const fileUrl = `/uploads/${jpgFileName}`;
        
        // Update group photo
        group.groupPhoto = fileUrl;
        await group.save();

        return NextResponse.json({
          message: 'Group photo uploaded successfully',
          photoUrl: fileUrl,
        });
      } catch (error) {
        console.error('Error processing image:', error);
        // Fall through to save original if processing fails
      }
    }

    // Save original file if sharp is not available or processing failed
    await writeFile(filePath, buffer);
    const fileUrl = `/uploads/${fileName}`;

    // Update group photo
    group.groupPhoto = fileUrl;
    await group.save();

    return NextResponse.json({
      message: 'Group photo uploaded successfully',
      photoUrl: fileUrl,
    });
  } catch (error) {
    console.error('Upload group photo error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload group photo' },
      { status: 500 }
    );
  }
}

