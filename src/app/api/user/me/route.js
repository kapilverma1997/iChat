import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import { verifyAccessToken } from '../../../../../lib/utils.js';

export async function GET(request) {
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

    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data (without sensitive fields)
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.otpSecret;

    // Ensure notification settings have defaults if missing
    if (!userObj.notificationSettings) {
      userObj.notificationSettings = {};
    }
    userObj.notificationSettings = {
      pushNotifications: userObj.notificationSettings.pushNotifications ?? true,
      desktopNotifications: userObj.notificationSettings.desktopNotifications ?? true,
      emailNotifications: userObj.notificationSettings.emailNotifications ?? false,
      soundEnabled: userObj.notificationSettings.soundEnabled ?? true,
      notificationPreview: userObj.notificationSettings.notificationPreview ?? true,
      showNotificationBadge: userObj.notificationSettings.showNotificationBadge ?? true,
      groupNotifications: userObj.notificationSettings.groupNotifications ?? true,
      directMessageNotifications: userObj.notificationSettings.directMessageNotifications ?? true,
      mentionNotifications: userObj.notificationSettings.mentionNotifications ?? true,
      reactionNotifications: userObj.notificationSettings.reactionNotifications ?? false,
    };

    // Ensure quiet hours have defaults if missing
    if (!userObj.quietHours) {
      userObj.quietHours = {};
    }
    userObj.quietHours = {
      enabled: userObj.quietHours.enabled ?? false,
      startTime: userObj.quietHours.startTime || '22:00',
      endTime: userObj.quietHours.endTime || '08:00',
    };

    // Ensure notification sound has default if missing
    userObj.notificationSound = userObj.notificationSound || 'default';

    // Ensure chat settings have defaults if missing
    if (!userObj.chatSettings) {
      userObj.chatSettings = {};
    }
    userObj.chatSettings = {
      readReceipts: userObj.chatSettings.readReceipts ?? true,
      typingIndicators: userObj.chatSettings.typingIndicators ?? true,
      linkPreviews: userObj.chatSettings.linkPreviews ?? true,
      spellCheck: userObj.chatSettings.spellCheck ?? true,
      enterToSend: userObj.chatSettings.enterToSend ?? true,
      markAsReadOnReply: userObj.chatSettings.markAsReadOnReply ?? true,
      showOnlineStatus: userObj.chatSettings.showOnlineStatus ?? true,
      showLastSeen: userObj.chatSettings.showLastSeen ?? true,
      showMessageTimestamps: userObj.chatSettings.showMessageTimestamps ?? true,
      compactMode: userObj.chatSettings.compactMode ?? false,
      showAvatars: userObj.chatSettings.showAvatars ?? true,
      showReactions: userObj.chatSettings.showReactions ?? true,
      allowEmojis: userObj.chatSettings.allowEmojis ?? true,
      allowStickers: userObj.chatSettings.allowStickers ?? true,
      allowGifs: userObj.chatSettings.allowGifs ?? true,
    };

    // Ensure media settings have defaults if missing
    if (!userObj.mediaSettings) {
      userObj.mediaSettings = {};
    }
    // Handle backward compatibility: migrate autoDownloadMedia from chatSettings if needed
    const autoDownloadMedia = userObj.mediaSettings.autoDownloadMedia ?? 
      userObj.chatSettings?.autoDownloadMedia ?? true;
    
    userObj.mediaSettings = {
      autoDownloadMedia: autoDownloadMedia,
      autoDownloadSizeLimit: userObj.mediaSettings.autoDownloadSizeLimit || 10,
      imageQuality: userObj.mediaSettings.imageQuality || 'high',
      videoQuality: userObj.mediaSettings.videoQuality || 'high',
      compressImages: userObj.mediaSettings.compressImages ?? false,
    };

    // Ensure message history settings have defaults if missing
    if (!userObj.messageHistorySettings) {
      userObj.messageHistorySettings = {};
    }
    userObj.messageHistorySettings = {
      autoDeleteEnabled: userObj.messageHistorySettings.autoDeleteEnabled ?? false,
      autoDeleteDays: userObj.messageHistorySettings.autoDeleteDays || 30,
      backupEnabled: userObj.messageHistorySettings.backupEnabled ?? false,
      archiveOldChats: userObj.messageHistorySettings.archiveOldChats ?? false,
      archiveAfterDays: userObj.messageHistorySettings.archiveAfterDays || 90,
    };

    // Ensure display settings have defaults if missing
    if (!userObj.displaySettings) {
      userObj.displaySettings = {};
    }
    userObj.displaySettings = {
      fontSize: userObj.displaySettings.fontSize || 'medium',
      messageDensity: userObj.displaySettings.messageDensity || 'comfortable',
      theme: userObj.displaySettings.theme || 'default',
    };

    return NextResponse.json({
      user: userObj,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user' },
      { status: 500 }
    );
  }
}
