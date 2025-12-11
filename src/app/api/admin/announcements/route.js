import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import { logAudit } from '../../../../../lib/auditLogger.js';
import Announcement from '../../../../../models/Announcement.js';
import { createNotification } from '../../../../../lib/notifications.js';
import { getIO } from '../../../../../lib/socket.js';

// Get all announcements
export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const isPublished = searchParams.get('isPublished');

    const filter = {};
    if (isPublished !== null && isPublished !== undefined) {
      filter.isPublished = isPublished === 'true';
    }

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'name email')
      .populate('targetUsers', 'name email')
      .populate('targetDepartments', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Announcement.countDocuments(filter);

    return NextResponse.json({
      announcements,
      page,
      limit,
      total,
      hasMore: total > page * limit,
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

// Create announcement
export async function POST(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const {
      title,
      content,
      type,
      targetAudience,
      targetUsers,
      targetDepartments,
      attachments,
      scheduledAt,
      expiresAt,
      priority,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const announcement = await Announcement.create({
      title,
      content,
      type: type || 'info',
      targetAudience: targetAudience || 'all',
      targetUsers: targetUsers || [],
      targetDepartments: targetDepartments || [],
      attachments: attachments || [],
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      priority: priority || 'normal',
      createdBy: auth.user._id,
      isPublished: !scheduledAt, // Auto-publish if not scheduled
      publishedAt: !scheduledAt ? new Date() : null,
    });

    // If published immediately, send notifications
    if (!scheduledAt) {
      await sendAnnouncementNotifications(announcement);
    }

    // Log audit
    await logAudit({
      action: 'announcement_create',
      category: 'announcement_create',
      adminUserId: auth.user._id,
      targetResourceId: announcement._id,
      targetResourceType: 'announcement',
      newValue: { title, targetAudience },
      request,
    });

    return NextResponse.json({
      message: 'Announcement created successfully',
      announcement,
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create announcement' },
      { status: 500 }
    );
  }
}

// Send announcement notifications
async function sendAnnouncementNotifications(announcement) {
  try {
    const User = (await import('../../../../../models/User.js')).default;
    const io = getIO();

    // Get target users based on audience
    let targetUserIds = [];
    
    if (announcement.targetAudience === 'all') {
      const allUsers = await User.find({ isActive: true }).select('_id');
      targetUserIds = allUsers.map((u) => u._id);
    } else if (announcement.targetAudience === 'employees') {
      const employees = await User.find({ role: 'employee', isActive: true }).select('_id');
      targetUserIds = employees.map((u) => u._id);
    } else if (announcement.targetAudience === 'managers') {
      const managers = await User.find({ role: { $in: ['admin', 'moderator'] }, isActive: true }).select('_id');
      targetUserIds = managers.map((u) => u._id);
    } else if (announcement.targetAudience === 'custom') {
      targetUserIds = announcement.targetUsers || [];
    }

    // Send notifications
    for (const userId of targetUserIds) {
      await createNotification({
        userId,
        type: 'system',
        category: 'system',
        title: announcement.title,
        body: announcement.content.substring(0, 100),
        data: {
          announcementId: announcement._id.toString(),
          type: announcement.type,
          priority: announcement.priority,
        },
        priority: announcement.priority,
      });

      // Emit socket event
      if (io) {
        io.to(`user:${userId}`).emit('announcement:new', {
          announcement: announcement.toObject(),
        });
      }
    }
  } catch (error) {
    console.error('Error sending announcement notifications:', error);
  }
}

