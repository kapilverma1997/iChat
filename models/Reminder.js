import mongoose, { Schema } from 'mongoose';

const ReminderSchema = new Schema(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    remindAt: {
      type: Date,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReminderSchema.index({ userId: 1, remindAt: 1 });
ReminderSchema.index({ messageId: 1 });
ReminderSchema.index({ isCompleted: 1 });

const Reminder = mongoose.models.Reminder || mongoose.model('Reminder', ReminderSchema);

export default Reminder;

