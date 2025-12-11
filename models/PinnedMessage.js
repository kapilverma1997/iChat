import mongoose, { Schema } from 'mongoose';

const PinnedMessageSchema = new Schema(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
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
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pinnedAt: {
      type: Date,
      default: Date.now,
    },
    order: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

PinnedMessageSchema.index({ chatId: 1, pinnedAt: -1 });
PinnedMessageSchema.index({ groupId: 1, pinnedAt: -1 });
PinnedMessageSchema.index({ order: 1 });

const PinnedMessage = mongoose.models.PinnedMessage || mongoose.model('PinnedMessage', PinnedMessageSchema);

export default PinnedMessage;

