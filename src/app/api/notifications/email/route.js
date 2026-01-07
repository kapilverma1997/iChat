import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Notification from '../../../../../models/Notification.js';
import User from '../../../../../models/User.js';
import Message from '../../../../../models/Message.js';
import GroupMessage from '../../../../../models/GroupMessage.js';
import Chat from '../../../../../models/Chat.js';
import Group from '../../../../../models/Group.js';
import { sendEmail } from '../../../../../lib/email.js';

// Send email notification
export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, type, title, body, data } = await request.json();

    if (!userId || !type || !title || !body) {
      return NextResponse.json(
        { error: 'User ID, type, title, and body are required' },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email notifications are enabled (check notificationSettings.emailNotifications first)
    const emailEnabled = targetUser.notificationSettings?.emailNotifications ?? targetUser.notificationPreferences?.emailEnabled ?? false;
    if (!emailEnabled) {
      return NextResponse.json(
        { error: 'Email notifications are disabled in your settings' },
        { status: 403 }
      );
    }

    // Check category preference
    const category = getCategoryFromType(type);
    if (!targetUser.notificationPreferences?.categories?.[category]) {
      return NextResponse.json({
        message: 'Email notification skipped due to user preferences',
      });
    }

    await sendEmail({
      to: targetUser.email,
      subject: title,
      html: body,
      text: body.replace(/<[^>]*>/g, ''), // Strip HTML tags
    });

    // Mark notification as emailed
    if (data?.notificationId) {
      await Notification.findByIdAndUpdate(data.notificationId, {
        isEmailed: true,
      });
    }

    return NextResponse.json({
      message: 'Email notification sent successfully',
    });
  } catch (error) {
    console.error('Send email notification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email notification' },
      { status: 500 }
    );
  }
}

// Send email digest (missed messages summary)
export async function PUT(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, intervalMinutes } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email notifications are enabled (check notificationSettings.emailNotifications first)
    const emailEnabled = targetUser.notificationSettings?.emailNotifications ?? targetUser.notificationPreferences?.emailEnabled ?? false;
    if (!emailEnabled) {
      return NextResponse.json(
        { error: 'Email notifications are disabled in your settings' },
        { status: 403 }
      );
    }

    const interval = intervalMinutes || targetUser.notificationPreferences?.emailDigestInterval || 60;
    const since = new Date(Date.now() - interval * 60 * 1000);

    // Get unread notifications
    const unreadNotifications = await Notification.find({
      userId: targetUser._id,
      isRead: false,
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    if (unreadNotifications.length === 0) {
      return NextResponse.json({
        message: 'No missed messages to send',
      });
    }

    // Group notifications by type
    const grouped = {};
    unreadNotifications.forEach((notif) => {
      if (!grouped[notif.type]) {
        grouped[notif.type] = [];
      }
      grouped[notif.type].push(notif);
    });

    // Build email content
    let emailBody = `
      <h2>You have ${unreadNotifications.length} missed notifications</h2>
      <ul>
    `;

    Object.keys(grouped).forEach((type) => {
      emailBody += `<li><strong>${type}:</strong> ${grouped[type].length} notifications</li>`;
    });

    emailBody += `</ul><p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chats">View in iChat</a></p>`;

    await sendEmail({
      to: targetUser.email,
      subject: `iChat: ${unreadNotifications.length} Missed Notifications`,
      html: emailBody,
      text: `You have ${unreadNotifications.length} missed notifications. Visit iChat to view them.`,
    });

    return NextResponse.json({
      message: 'Email digest sent successfully',
      notificationCount: unreadNotifications.length,
    });
  } catch (error) {
    console.error('Send email digest error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email digest' },
      { status: 500 }
    );
  }
}

function getCategoryFromType(type) {
  const categoryMap = {
    mention: 'mentions',
    message: 'directMessages',
    group_message: 'groupMessages',
    reply: 'replies',
    reaction: 'reactions',
    file_upload: 'fileUploads',
    system: 'system',
    admin_alert: 'adminAlerts',
    group_invite: 'groupInvites',
  };
  return categoryMap[type] || 'directMessages';
}

