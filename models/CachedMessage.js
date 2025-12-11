import mongoose, { Schema } from 'mongoose';

const CachedMessageSchema = new Schema(
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
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
      index: true,
    },
    messageData: {
      type: Schema.Types.Mixed, // Full message object
      required: true,
    },
    cachedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
    accessCount: {
      type: Number,
      default: 0,
    },
    storageType: {
      type: String,
      enum: ['localStorage', 'indexedDB', 'memory'],
      default: 'memory',
    },
  },
  {
    timestamps: true,
  }
);

CachedMessageSchema.index({ user: 1, chatId: 1, cachedAt: -1 });
CachedMessageSchema.index({ user: 1, groupId: 1, cachedAt: -1 });
CachedMessageSchema.index({ cachedAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

const CachedMessage = mongoose.models.CachedMessage || mongoose.model('CachedMessage', CachedMessageSchema);

export default CachedMessage;

