import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import { verifyAccessToken } from '../../../../../lib/utils.js';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Find the user by ID
    const user = await User.findById(id).select('-passwordHash -otpSecret').lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data (respecting privacy settings)
    // Note: In a production app, you might want to check privacy settings
    // and only return fields the user has allowed to be visible
    return NextResponse.json({
      user: user,
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user' },
      { status: 500 }
    );
  }
}

