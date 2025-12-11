import mongoose, { Schema } from 'mongoose';

const DeviceSchema = new Schema(
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
    browserVersion: {
      type: String,
    },
    os: {
      type: String,
    },
    osVersion: {
      type: String,
    },
    ipAddress: {
      type: String,
      index: true,
    },
    location: {
      country: String,
      region: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    isTrusted: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isRestricted: {
      type: Boolean,
      default: false,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
    loginCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

DeviceSchema.index({ userId: 1, isBlocked: 1 });
DeviceSchema.index({ userId: 1, lastUsedAt: -1 });
DeviceSchema.index({ deviceId: 1, userId: 1 }, { unique: true });

const Device = mongoose.models.Device || mongoose.model('Device', DeviceSchema);

export default Device;

