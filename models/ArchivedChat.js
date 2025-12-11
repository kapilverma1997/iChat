import mongoose, { Schema } from 'mongoose';

const ArchivedChatSchema = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    archivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      default: 'Inactive',
    },
    lastActivityAt: {
      type: Date,
      required: true,
    },
    canRestore: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

ArchivedChatSchema.index({ archivedAt: -1 });
ArchivedChatSchema.index({ chatId: 1 });

const ArchivedChat = mongoose.models.ArchivedChat || mongoose.model('ArchivedChat', ArchivedChatSchema);

export default ArchivedChat;

