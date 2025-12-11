import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import { isAdmin } from '../../../../../lib/adminAuth.js';

export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { isAdmin: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const admin = await isAdmin(user._id);

    if (!admin) {
      return NextResponse.json(
        { isAdmin: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Return user data (without sensitive fields)
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.passwordHash;
    delete userObj.otpSecret;
    delete userObj.privateKeyEncrypted;
    delete userObj.backupCodes;

    return NextResponse.json({
      isAdmin: true,
      user: {
        _id: userObj._id,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role || 'employee',
        profilePhoto: userObj.profilePhoto,
      },
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { isAdmin: false, error: error.message || 'Failed to check admin status' },
      { status: 500 }
    );
  }
}

