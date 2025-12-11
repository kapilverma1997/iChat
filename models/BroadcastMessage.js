import mongoose, { Schema } from 'mongoose';

const BroadcastMessageSchema = new Schema(
  {
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'BroadcastChannel',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    attachments: [
      {
        fileId: {
          type: Schema.Types.ObjectId,
          ref: 'File',
        },
        fileName: String,
        fileUrl: String,
      },
    ],
    readBy: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    readCount: {
      type: Number,
      default: 0,
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

BroadcastMessageSchema.index({ channelId: 1, createdAt: -1 });
BroadcastMessageSchema.index({ senderId: 1 });

const BroadcastMessage = mongoose.models.BroadcastMessage || mongoose.model('BroadcastMessage', BroadcastMessageSchema);

export default BroadcastMessage;

