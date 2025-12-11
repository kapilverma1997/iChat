import mongoose, { Schema } from 'mongoose';

const OfflineQueueSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    messageData: {
      type: Schema.Types.Mixed, // Message object to send
      required: true,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      index: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sending', 'sent', 'failed'],
      default: 'pending',
      index: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    queuedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    sentAt: {
      type: Date,
    },
    error: {
      type: String,
    },
    deviceId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

OfflineQueueSchema.index({ user: 1, status: 1, queuedAt: 1 });
OfflineQueueSchema.index({ status: 'pending', queuedAt: 1 });

const OfflineQueue = mongoose.models.OfflineQueue || mongoose.model('OfflineQueue', OfflineQueueSchema);

export default OfflineQueue;

