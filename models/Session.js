import mongoose, { Schema } from 'mongoose';

const SessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['jwt', 'refresh', 'otp', 'reset'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete expired sessions
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
SessionSchema.index({ userId: 1, type: 1 });
SessionSchema.index({ token: 1, type: 1 });

const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

export default Session;
