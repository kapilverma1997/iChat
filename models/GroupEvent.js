import mongoose, { Schema } from 'mongoose';

const AttendeeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['going', 'maybe', 'not-going'],
    default: 'maybe',
  },
  respondedAt: {
    type: Date,
    default: Date.now,
  },
});

const GroupEventSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'GroupMessage',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Event title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Event description cannot exceed 1000 characters'],
      default: '',
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
      default: '',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    isAllDay: {
      type: Boolean,
      default: false,
    },
    attendees: [AttendeeSchema],
    reminders: [
      {
        type: {
          type: String,
          enum: ['none', '5min', '15min', '30min', '1hour', '1day'],
          default: '15min',
        },
        sent: {
          type: Boolean,
          default: false,
        },
      },
    ],
    isCancelled: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
GroupEventSchema.index({ groupId: 1, startDate: 1 });
GroupEventSchema.index({ messageId: 1 });
GroupEventSchema.index({ createdBy: 1 });
GroupEventSchema.index({ startDate: 1 });

const GroupEvent = mongoose.models.GroupEvent || mongoose.model('GroupEvent', GroupEventSchema);

export default GroupEvent;

