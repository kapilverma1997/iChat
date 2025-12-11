import mongoose, { Schema } from 'mongoose';

const MeetingSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    participants: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'tentative'],
        default: 'pending',
      },
      respondedAt: Date,
      reminderSent: {
        type: Boolean,
        default: false,
      },
    }],
    calendarEvents: [{
      provider: {
        type: String,
        enum: ['google', 'outlook', 'apple'],
      },
      eventId: String,
      calendarId: String,
      syncedAt: Date,
    }],
    location: {
      type: String,
      default: '',
    },
    meetingLink: {
      type: String,
      default: '',
    },
    reminders: [{
      minutesBefore: Number,
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: Date,
    }],
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    cancelledAt: Date,
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

MeetingSchema.index({ chatId: 1, startTime: 1 });
MeetingSchema.index({ groupId: 1, startTime: 1 });
MeetingSchema.index({ createdBy: 1, startTime: 1 });
MeetingSchema.index({ 'participants.user': 1, startTime: 1 });
MeetingSchema.index({ startTime: 1, status: 1 });

const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);

export default Meeting;

