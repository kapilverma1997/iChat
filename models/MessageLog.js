import mongoose, { Schema } from 'mongoose';

const MessageLogSchema = new Schema(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    content: {
      type: String,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'file', 'audio', 'location', 'contact'],
    },
    fileUrl: {
      type: String,
    },
    fileName: {
      type: String,
    },
    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },
    flaggedReason: {
      type: String,
    },
    flaggedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

MessageLogSchema.index({ senderId: 1, createdAt: -1 });
MessageLogSchema.index({ chatId: 1, createdAt: -1 });
MessageLogSchema.index({ groupId: 1, createdAt: -1 });
MessageLogSchema.index({ isFlagged: 1, createdAt: -1 });
MessageLogSchema.index({ createdAt: -1 });

const MessageLog = mongoose.models.MessageLog || mongoose.model('MessageLog', MessageLogSchema);

export default MessageLog;

