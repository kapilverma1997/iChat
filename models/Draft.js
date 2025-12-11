import mongoose, { Schema } from 'mongoose';

const DraftSchema = new Schema(
  {
    user: {
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
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      index: true,
    },
    content: {
      type: String,
      default: '',
    },
    attachments: [{
      url: String,
      fileName: String,
      fileType: String,
      fileSize: Number,
      tempId: String,
    }],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastSavedAt: {
      type: Date,
      default: Date.now,
    },
    deviceId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

DraftSchema.index({ user: 1, chatId: 1 }, { unique: true });
DraftSchema.index({ user: 1, groupId: 1 }, { unique: true });
DraftSchema.index({ lastSavedAt: -1 });

const Draft = mongoose.models.Draft || mongoose.model('Draft', DraftSchema);

export default Draft;

