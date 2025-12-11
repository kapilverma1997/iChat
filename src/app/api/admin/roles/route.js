import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import { logAudit } from '../../../../../lib/auditLogger.js';
import User from '../../../../../models/User.js';

// Get all roles and permissions
export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const roles = {
      owner: {
        name: 'Owner',
        permissions: [
          'all',
        ],
      },
      admin: {
        name: 'Admin',
        permissions: [
          'edit_group_info',
          'delete_message',
          'remove_user',
          'upload_files',
          'manage_announcements',
          'access_analytics',
          'archive_chats',
          'manage_users',
          'view_audit_logs',
        ],
      },
      moderator: {
        name: 'Moderator',
        permissions: [
          'edit_group_info',
          'delete_message',
          'remove_user',
          'upload_files',
        ],
      },
      employee: {
        name: 'Employee',
        permissions: [
          'upload_files',
          'create_group',
          'send_messages',
        ],
      },
      guest: {
        name: 'Guest',
        permissions: [
          'view_messages',
          'send_messages',
        ],
      },
      'read-only': {
        name: 'Read-Only',
        permissions: [
          'view_messages',
        ],
      },
    };

    // Get role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      roles,
      roleDistribution,
    });
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// Update user role
export async function PATCH(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId, newRole } = await request.json();

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'User ID and new role are required' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oldRole = user.role;
    user.role = newRole;
    await user.save();

    // Log audit
    await logAudit({
      action: 'role_change',
      category: 'role_change',
      adminUserId: auth.user._id,
      targetUserId: user._id,
      targetResourceType: 'user',
      oldValue: { role: oldRole },
      newValue: { role: newRole },
      request,
    });

    return NextResponse.json({
      message: 'Role updated successfully',
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update role' },
      { status: 500 }
    );
  }
}

