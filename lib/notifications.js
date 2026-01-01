import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getIO } from './socket.js';
import webpush from 'web-push';
import { sendEmail } from './email.js';

// Configure web push
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@ichat.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Create and send notification
export async function createNotification({
  userId,
  type,
  category,
  title,
  body,
  data = {},
  chatId,
  groupId,
  messageId,
  priority = 'normal',
}) {
  let notification = null;
  
  // Normalize category to snake_case format
  const normalizeCategory = (cat) => {
    if (!cat) return getCategoryFromType(type);
    // Convert camelCase to snake_case if needed
    const categoryMap = {
      'directMessages': 'direct_messages',
      'fileUploads': 'file_uploads',
      'adminAlerts': 'admin_alerts',
      'groupInvites': 'group_invites',
    };
    return categoryMap[cat] || cat;
  };
  
  // Determine category - ensure it's in snake_case format
  const notificationCategory = normalizeCategory(category || getCategoryFromType(type));
  
  // Validate category is in correct format (snake_case)
  const validCategories = ['mentions', 'direct_messages', 'replies', 'file_uploads', 'system', 'admin_alerts', 'group_invites'];
  const finalCategory = validCategories.includes(notificationCategory) 
    ? notificationCategory 
    : 'direct_messages';

  try {
    // Create notification in database
    notification = await Notification.create({
      userId,
      type,
      category: finalCategory,
      title,
      body,
      data,
      chatId,
      groupId,
      messageId,
      priority,
    });
  } catch (error) {
    console.error('Create notification error:', error);
    // Create a minimal notification object for socket emission even if DB creation fails
    notification = {
      _id: messageId || new Date().getTime().toString(),
      userId,
      type,
      category: finalCategory, // Use normalized category
      title,
      body,
      data,
      chatId,
      groupId,
      messageId,
      priority,
      isRead: false,
      createdAt: new Date(),
      toObject: function() {
        return {
          _id: this._id,
          userId: this.userId,
          type: this.type,
          category: this.category,
          title: this.title,
          body: this.body,
          data: this.data,
          chatId: this.chatId,
          groupId: this.groupId,
          messageId: this.messageId,
          priority: this.priority,
          isRead: this.isRead,
          createdAt: this.createdAt,
        };
      },
    };
  }

  try {
    // Get user preferences
    const user = await User.findById(userId);
    if (!user) {
      // Still emit socket event even if user not found
      const io = getIO();
      if (io && notification) {
        io.to(`user:${userId}`).emit('notification:new', {
          notification: notification.toObject ? notification.toObject() : notification,
        });
      }
      return notification;
    }

    // Send in-app notification via Socket.io
    const io = getIO();
    if (io && notification) {
      io.to(`user:${userId}`).emit('notification:new', {
        notification: notification.toObject ? notification.toObject() : notification,
      });
    }

    // Send push notification if enabled (only if notification was saved to DB)
    if (notification && notification._id && user.notificationPreferences?.pushEnabled && user.pushSubscription) {
      // Check if subscription has valid endpoint
      if (!user.pushSubscription.endpoint) {
        // Remove invalid subscription that doesn't have endpoint
        console.warn('Removing invalid push subscription (missing endpoint) for user:', userId);
        user.pushSubscription = undefined;
        await user.save();
      } else {
        try {
          const payload = JSON.stringify({
            title,
            body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
              ...data,
              notificationId: notification._id.toString(),
            },
          });

          await webpush.sendNotification(user.pushSubscription, payload);
          if (notification.save) {
            notification.isPushed = true;
            await notification.save();
          }
        } catch (error) {
          console.error('Push notification error:', error);
          // Remove invalid subscription
          if (error.statusCode === 410 || error.statusCode === 404 || error.message?.includes('endpoint')) {
            user.pushSubscription = undefined;
            await user.save();
          }
        }
      }
    }

    // Send email notification if enabled and category is allowed (only if notification was saved to DB)
    if (
      notification &&
      notification._id &&
      user.notificationPreferences?.emailEnabled &&
      user.notificationPreferences?.categories?.[categoryToCamelCase(notification.category || 'direct_messages')]
    ) {
      try {
        await sendEmail({
          to: user.email,
          subject: title,
          html: body,
          text: body.replace(/<[^>]*>/g, ''),
        });
        if (notification.save) {
          notification.isEmailed = true;
          await notification.save();
        }
      } catch (error) {
        console.error('Email notification error:', error);
      }
    }

    return notification;
  } catch (error) {
    console.error('Unexpected error in createNotification:', error);
    // Normalize category for fallback
    const normalizeCategory = (cat) => {
      if (!cat) return getCategoryFromType(type);
      const categoryMap = {
        'directMessages': 'direct_messages',
        'fileUploads': 'file_uploads',
        'adminAlerts': 'admin_alerts',
        'groupInvites': 'group_invites',
      };
      return categoryMap[cat] || cat;
    };
    const fallbackCategory = normalizeCategory(category || getCategoryFromType(type));
    const validCategories = ['mentions', 'direct_messages', 'replies', 'file_uploads', 'system', 'admin_alerts', 'group_invites'];
    const finalFallbackCategory = validCategories.includes(fallbackCategory) ? fallbackCategory : 'direct_messages';
    
    // Return minimal notification object even on unexpected errors
    return {
      _id: messageId || new Date().getTime().toString(),
      userId,
      type,
      category: finalFallbackCategory,
      title,
      body,
      data,
      chatId,
      groupId,
      messageId,
      priority,
      isRead: false,
      createdAt: new Date(),
    };
  }
}

// Create notification for new message
export async function notifyNewMessage({
  userId,
  senderName,
  messageContent,
  chatId,
  groupId,
  messageId,
  isMention = false,
}) {
  const title = isMention
    ? `${senderName} mentioned you`
    : `New message from ${senderName}`;
  const body = messageContent.substring(0, 100);
  const type = isMention ? 'mention' : 'message';
  const category = isMention ? 'mentions' : 'direct_messages';

  return createNotification({
    userId,
    type,
    category,
    title,
    body,
    data: {
      senderName,
      messageContent,
    },
    chatId,
    groupId,
    messageId,
  });
}

// Create notification for reply
export async function notifyReply({
  userId,
  senderName,
  messageContent,
  chatId,
  groupId,
  messageId,
}) {
  return createNotification({
    userId,
    type: 'reply',
    category: 'replies',
    title: `${senderName} replied to your message`,
    body: messageContent.substring(0, 100),
    data: {
      senderName,
      messageContent,
    },
    chatId,
    groupId,
    messageId,
  });
}

// Create notification for reaction
export async function notifyReaction({
  userId,
  senderName,
  emoji,
  chatId,
  groupId,
  messageId,
}) {
  return createNotification({
    userId,
    type: 'reaction',
    category: 'replies',
    title: `${senderName} reacted with ${emoji}`,
    body: '',
    data: {
      senderName,
      emoji,
    },
    chatId,
    groupId,
    messageId,
    priority: 'low',
  });
}

// Create notification for file upload
export async function notifyFileUpload({
  userId,
  senderName,
  fileName,
  chatId,
  groupId,
  messageId,
}) {
  return createNotification({
    userId,
    type: 'file_upload',
    category: 'file_uploads',
    title: `${senderName} shared a file`,
    body: fileName,
    data: {
      senderName,
      fileName,
    },
    chatId,
    groupId,
    messageId,
  });
}

// Create notification for group invite
export async function notifyGroupInvite({
  userId,
  groupName,
  inviterName,
  groupId,
}) {
  return createNotification({
    userId,
    type: 'group_invite',
    category: 'group_invites',
    title: `${inviterName} invited you to ${groupName}`,
    body: `You've been invited to join ${groupName}`,
    data: {
      groupName,
      inviterName,
    },
    groupId,
  });
}

// Create notification for suspicious login
export async function notifySuspiciousLogin({
  userId,
  ipAddress,
  location,
  reasons,
}) {
  return createNotification({
    userId,
    type: 'suspicious_login',
    category: 'admin_alerts',
    title: 'Suspicious Login Detected',
    body: `A login was detected from ${ipAddress}${location?.city ? ` in ${location.city}` : ''}`,
    data: {
      ipAddress,
      location,
      reasons,
    },
    priority: 'high',
  });
}

// Create notification for message expiration
export async function notifyMessageExpired({
  userId,
  messageId,
  chatId,
  groupId,
}) {
  return createNotification({
    userId,
    type: 'message_expired',
    category: 'system',
    title: 'Message Expired',
    body: 'A message you sent has expired and been deleted',
    data: {
      messageId,
    },
    chatId,
    groupId,
    messageId,
    priority: 'low',
  });
}

function getCategoryFromType(type) {
  const categoryMap = {
    mention: 'mentions',
    message: 'direct_messages',
    reply: 'replies',
    reaction: 'replies',
    file_upload: 'file_uploads',
    system: 'system',
    admin_alert: 'admin_alerts',
    suspicious_login: 'admin_alerts',
    group_invite: 'group_invites',
    message_expired: 'system',
    message_deleted: 'system',
  };
  return categoryMap[type] || 'direct_messages';
}

// Convert snake_case category to camelCase for user preferences
function categoryToCamelCase(category) {
  const categoryMap = {
    'mentions': 'mentions',
    'direct_messages': 'directMessages',
    'replies': 'replies',
    'file_uploads': 'fileUploads',
    'system': 'system',
    'admin_alerts': 'adminAlerts',
    'group_invites': 'groupInvites',
  };
  return categoryMap[category] || 'directMessages';
}

