import mongoose, { Schema } from 'mongoose';

const MessageStatSchema = new Schema(
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
    messageCount: {
      type: Number,
      default: 0,
    },
    textMessages: {
      type: Number,
      default: 0,
    },
    mediaMessages: {
      type: Number,
      default: 0,
    },
    fileMessages: {
      type: Number,
      default: 0,
    },
    reactionsCount: {
      type: Number,
      default: 0,
    },
    averageResponseTime: {
      type: Number, // in seconds
      default: 0,
    },
    activeHours: [{
      hour: Number, // 0-23
      messageCount: Number,
    }],
  },
  {
    timestamps: true,
  }
);

MessageStatSchema.index({ userId: 1, date: -1 });
MessageStatSchema.index({ chatId: 1, date: -1 });
MessageStatSchema.index({ groupId: 1, date: -1 });
MessageStatSchema.index({ date: -1 });

const MessageStat = mongoose.models.MessageStat || mongoose.model('MessageStat', MessageStatSchema);

export default MessageStat;

