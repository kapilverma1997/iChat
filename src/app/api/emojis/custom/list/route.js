import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth.js';
import CustomEmoji from '../../../../../models/CustomEmoji.js';
import connectDB from '../../../../../lib/mongodb.js';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const category = searchParams.get('category');

    let query = { isActive: true };
    if (groupId) {
      query.$or = [
        { groupId },
        { isGlobal: true },
      ];
    } else {
      query.isGlobal = true;
    }

    if (category) {
      query.category = category;
    }

    const emojis = await CustomEmoji.find(query)
      .populate('uploadedBy', 'name email profilePhoto')
      .sort({ usageCount: -1, createdAt: -1 });

    return NextResponse.json({ emojis });
  } catch (error) {
    console.error('Error fetching custom emojis:', error);
    return NextResponse.json({ error: 'Failed to fetch custom emojis' }, { status: 500 });
  }
}

