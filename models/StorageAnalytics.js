import mongoose, { Schema } from 'mongoose';

const StorageAnalyticsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    fileType: {
      type: String,
      enum: ['image', 'video', 'document', 'audio', 'other'],
    },
    fileSize: {
      type: Number, // in bytes
      required: true,
    },
    fileCount: {
      type: Number,
      default: 1,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

StorageAnalyticsSchema.index({ userId: 1, date: -1 });
StorageAnalyticsSchema.index({ chatId: 1 });
StorageAnalyticsSchema.index({ groupId: 1 });
StorageAnalyticsSchema.index({ fileType: 1, date: -1 });

const StorageAnalytics = mongoose.models.StorageAnalytics || mongoose.model('StorageAnalytics', StorageAnalyticsSchema);

export default StorageAnalytics;

