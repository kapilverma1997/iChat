import mongoose, { Schema } from 'mongoose';

const FileUsageStatSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
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
    date: {
      type: Date,
      required: true,
      index: true,
    },
    fileType: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'other'],
      index: true,
    },
    fileSize: {
      type: Number, // in bytes
      default: 0,
    },
    uploadCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    storageUsed: {
      type: Number, // in bytes
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

FileUsageStatSchema.index({ userId: 1, date: -1 });
FileUsageStatSchema.index({ chatId: 1, date: -1 });
FileUsageStatSchema.index({ groupId: 1, date: -1 });
FileUsageStatSchema.index({ fileType: 1, date: -1 });
FileUsageStatSchema.index({ date: -1 });

const FileUsageStat = mongoose.models.FileUsageStat || mongoose.model('FileUsageStat', FileUsageStatSchema);

export default FileUsageStat;

