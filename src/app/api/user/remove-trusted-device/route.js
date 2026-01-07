import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import { verifyAccessToken } from '../../../../../lib/utils.js';

export async function POST(request) {
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

    const body = await request.json();
    const { deviceId } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove trusted device
    if (user.trustedDevices && Array.isArray(user.trustedDevices)) {
      user.trustedDevices = user.trustedDevices.filter(
        (device) => device.deviceId !== deviceId
      );
      await user.save();
    }

    return NextResponse.json({
      message: 'Trusted device removed successfully',
    });
  } catch (error) {
    console.error('Remove trusted device error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove trusted device' },
      { status: 500 }
    );
  }
}

