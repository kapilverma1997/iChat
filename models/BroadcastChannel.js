import mongoose, { Schema } from 'mongoose';

const BroadcastChannelSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    logo: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscribers: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        subscribedAt: {
          type: Date,
          default: Date.now,
        },
        isMuted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    settings: {
      allowComments: {
        type: Boolean,
        default: false,
      },
      requireApproval: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

BroadcastChannelSchema.index({ isActive: 1 });
BroadcastChannelSchema.index({ 'subscribers.userId': 1 });
BroadcastChannelSchema.index({ createdBy: 1 });

const BroadcastChannel = mongoose.models.BroadcastChannel || mongoose.model('BroadcastChannel', BroadcastChannelSchema);

export default BroadcastChannel;

