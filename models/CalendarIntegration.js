import mongoose, { Schema } from 'mongoose';

const CalendarIntegrationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['google', 'outlook'],
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    tokenExpiry: {
      type: Date,
    },
    calendarId: {
      type: String,
      default: 'primary',
    },
    email: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSyncedAt: {
      type: Date,
    },
    syncSettings: {
      syncDirection: {
        type: String,
        enum: ['both', 'to-calendar', 'from-calendar'],
        default: 'both',
      },
      autoCreateEvents: {
        type: Boolean,
        default: true,
      },
      syncInterval: {
        type: Number, // minutes
        default: 15,
      },
    },
  },
  {
    timestamps: true,
  }
);

CalendarIntegrationSchema.index({ user: 1, provider: 1 }, { unique: true });

const CalendarIntegration = mongoose.models.CalendarIntegration || mongoose.model('CalendarIntegration', CalendarIntegrationSchema);

export default CalendarIntegration;

