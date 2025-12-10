import mongoose, { Schema } from 'mongoose';

const ScheduledMessageSchema = new Schema(
  {
    message: {
      content: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: [
          'text',
          'emoji',
          'gif',
          'sticker',
          'image',
          'video',
          'file',
          'voice',
          'location',
          'contact',
          'code',
          'markdown',
          'audio',
        ],
        default: 'text',
      },
      fileUrl: String,
      fileName: String,
      fileSize: Number,
      metadata: Schema.Types.Mixed,
      priority: {
        type: String,
        enum: ['normal', 'important', 'urgent'],
        default: 'normal',
      },
      tags: [
        {
          type: String,
          enum: ['important', 'todo', 'reminder'],
        },
      ],
    },
    sendAt: {
      type: Date,
      required: true,
    },
    targetChat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    },
    targetGroup: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isSent: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ScheduledMessageSchema.index({ sendAt: 1, isSent: 1 });
ScheduledMessageSchema.index({ senderId: 1 });
ScheduledMessageSchema.index({ targetChat: 1 });
ScheduledMessageSchema.index({ targetGroup: 1 });

const ScheduledMessage =
  mongoose.models.ScheduledMessage || mongoose.model('ScheduledMessage', ScheduledMessageSchema);

export default ScheduledMessage;

