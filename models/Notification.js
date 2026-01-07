import mongoose, { Schema } from 'mongoose';

const NotificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'message',
        'mention',
        'reply',
        'reaction',
        'file_upload',
        'group_invite',
        'system',
        'admin_alert',
        'suspicious_login',
        'message_expired',
        'message_deleted',
      ],
      required: true,
    },
    category: {
      type: String,
      enum: ['mentions', 'direct_messages', 'group_messages', 'replies', 'reactions', 'file_uploads', 'system', 'admin_alerts', 'group_invites'],
      default: 'direct_messages',
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    // Reference to related entities
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    isPushed: {
      type: Boolean,
      default: false,
    },
    isEmailed: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1 });
NotificationSchema.index({ createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export default Notification;

