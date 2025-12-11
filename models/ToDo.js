import mongoose, { Schema } from 'mongoose';

const ToDoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
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
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    attachments: [{
      url: String,
      fileName: String,
      fileType: String,
      fileSize: Number,
    }],
    comments: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      content: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
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
  },
  {
    timestamps: true,
  }
);

ToDoSchema.index({ chatId: 1, createdAt: -1 });
ToDoSchema.index({ groupId: 1, createdAt: -1 });
ToDoSchema.index({ assignedTo: 1, status: 1 });
ToDoSchema.index({ dueDate: 1, status: 1 });

const ToDo = mongoose.models.ToDo || mongoose.model('ToDo', ToDoSchema);

export default ToDo;

