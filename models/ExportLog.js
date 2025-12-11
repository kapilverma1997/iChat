import mongoose, { Schema } from 'mongoose';

const ExportLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    exportType: {
      type: String,
      enum: ['chat', 'workspace', 'analytics'],
      required: true,
    },
    format: {
      type: String,
      enum: ['pdf', 'excel', 'json'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId, // chatId, groupId, or null for workspace
      index: true,
    },
    targetType: {
      type: String,
      enum: ['chat', 'group', 'workspace'],
    },
    fileUrl: {
      type: String,
    },
    fileSize: {
      type: Number, // in bytes
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    options: {
      includeMedia: Boolean,
      includeReactions: Boolean,
      includeTimestamps: Boolean,
      dateRange: {
        start: Date,
        end: Date,
      },
    },
    error: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ExportLogSchema.index({ user: 1, createdAt: -1 });
ExportLogSchema.index({ status: 1, createdAt: -1 });
ExportLogSchema.index({ exportType: 1, createdAt: -1 });

const ExportLog = mongoose.models.ExportLog || mongoose.model('ExportLog', ExportLogSchema);

export default ExportLog;

