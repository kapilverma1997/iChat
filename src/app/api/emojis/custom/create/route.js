import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth.js';
import CustomEmoji from '../../../../../models/CustomEmoji.js';
import connectDB from '../../../../../lib/mongodb.js';

export async function POST(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name');
    const imageFile = formData.get('image');
    const groupId = formData.get('groupId');
    const isGlobal = formData.get('isGlobal') === 'true';
    const category = formData.get('category') || 'custom';
    const tags = formData.get('tags') ? formData.get('tags').split(',') : [];

    if (!name || !imageFile) {
      return NextResponse.json({ error: 'Name and image are required' }, { status: 400 });
    }

    // In a real app, you'd upload the image to cloud storage
    // For now, we'll use a placeholder URL
    const imageUrl = `/uploads/emojis/${Date.now()}_${imageFile.name}`;

    const emoji = new CustomEmoji({
      name,
      imageUrl,
      uploadedBy: user._id,
      groupId: groupId || null,
      isGlobal: isGlobal && !groupId,
      category,
      tags,
    });

    await emoji.save();

    return NextResponse.json({ emoji }, { status: 201 });
  } catch (error) {
    console.error('Error creating custom emoji:', error);
    return NextResponse.json({ error: 'Failed to create custom emoji' }, { status: 500 });
  }
}

