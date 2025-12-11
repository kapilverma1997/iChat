import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import DocumentVersion from '../../../../../../../models/DocumentVersion.js';
import connectDB from '../../../../../../../lib/mongodb.js';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const versions = await DocumentVersion.find({ documentId: params.id })
      .populate('createdBy', 'name email profilePhoto')
      .sort({ version: -1 });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}

