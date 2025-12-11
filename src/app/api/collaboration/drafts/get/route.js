import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth.js';
import Draft from '../../../../../models/Draft.js';
import connectDB from '../../../../../lib/mongodb.js';

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

    const draft = await Draft.findOne({
      user: user._id,
      chatId: chatId || null,
      groupId: groupId || null,
    });

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 });
  }
}

