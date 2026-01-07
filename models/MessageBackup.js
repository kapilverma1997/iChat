import mongoose, { Schema } from 'mongoose';

const MessageBackupSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      index: true,
    },
    messages: [
      {
        messageId: {
          type: Schema.Types.ObjectId,
          ref: 'Message',
          required: true,
        },
        messageData: {
          type: Schema.Types.Mixed, // Full message object snapshot
          required: true,
        },
        backedUpAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    backupType: {
      type: String,
      enum: ['full', 'incremental', 'scheduled'],
      default: 'scheduled',
    },
    backupDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    filePath: {
      type: String, // Optional: path to exported file if backing up to file system
    },
    size: {
      type: Number, // Size in bytes
      default: 0,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
MessageBackupSchema.index({ userId: 1, backupDate: -1 });
MessageBackupSchema.index({ chatId: 1, backupDate: -1 });
MessageBackupSchema.index({ status: 1 });

const MessageBackup = mongoose.models.MessageBackup || mongoose.model('MessageBackup', MessageBackupSchema);

export default MessageBackup;

