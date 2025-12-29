import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../../lib/adminAuth.js';
import { logAudit } from '../../../../../../lib/auditLogger.js';
import User from '../../../../../../models/User.js';
import { hashPassword } from '../../../../../../lib/utils.js';

// Get user by ID
export async function GET(request, { params }) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    const { id } = await params;
    const user = await User.findById(id).select('-passwordHash -otpSecret').lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// Update user
export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oldValue = {
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };

    // Update fields
    if (body.name) user.name = body.name;
    if (body.email) user.email = body.email;
    if (body.role) user.role = body.role;
    if (body.phone) user.phone = body.phone;
    if (body.designation) user.designation = body.designation;
    if (body.password) {
      user.passwordHash = await hashPassword(body.password);
    }
    if (body.isActive !== undefined) {
      user.isActive = body.isActive;
    }

    await user.save();

    // Log audit
    await logAudit({
      action: 'user_update',
      category: 'user_update',
      adminUserId: auth.user._id,
      targetUserId: user._id,
      targetResourceType: 'user',
      oldValue,
      newValue: {
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      request,
    });

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return NextResponse.json({
      message: 'User updated successfully',
      user: userObj,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Delete user
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't allow deleting yourself
    if (user._id.toString() === auth.user._id.toString()) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Log audit before deletion
    await logAudit({
      action: 'user_remove',
      category: 'user_remove',
      adminUserId: auth.user._id,
      targetUserId: user._id,
      targetResourceType: 'user',
      oldValue: { email: user.email, name: user.name },
      request,
    });

    // Soft delete - set isActive to false instead of actually deleting
    user.isActive = false;
    await user.save();

    return NextResponse.json({
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

