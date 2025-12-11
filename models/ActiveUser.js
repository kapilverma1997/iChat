import mongoose, { Schema } from 'mongoose';

const ActiveUserSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    deviceName: {
      type: String,
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    location: {
      country: String,
      region: String,
      city: String,
    },
    currentChatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    },
    currentGroupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    isOnline: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ActiveUserSchema.index({ userId: 1, isOnline: 1 });
ActiveUserSchema.index({ lastActivityAt: -1 });
ActiveUserSchema.index({ deviceId: 1, isOnline: 1 });

const ActiveUser = mongoose.models.ActiveUser || mongoose.model('ActiveUser', ActiveUserSchema);

export default ActiveUser;

