import mongoose, { Schema } from 'mongoose';

const TaskAssignmentSchema = new Schema(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'ToDo',
      required: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    notified: {
      type: Boolean,
      default: false,
    },
    notifiedAt: Date,
    activityLog: [{
      action: String,
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      details: Schema.Types.Mixed,
    }],
    reminders: [{
      minutesBefore: Number,
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: Date,
    }],
  },
  {
    timestamps: true,
  }
);

TaskAssignmentSchema.index({ assignedTo: 1, status: 1 });
TaskAssignmentSchema.index({ dueDate: 1, status: 1 });
TaskAssignmentSchema.index({ taskId: 1, assignedTo: 1 }, { unique: true });

const TaskAssignment = mongoose.models.TaskAssignment || mongoose.model('TaskAssignment', TaskAssignmentSchema);

export default TaskAssignment;

