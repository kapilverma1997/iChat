import mongoose, { Schema } from 'mongoose';

const PollOptionSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  votes: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      votedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const GroupPollSchema = new Schema(
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
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Poll question cannot exceed 500 characters'],
    },
    options: [PollOptionSchema],
    allowMultipleChoices: {
      type: Boolean,
      default: false,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    closedAt: {
      type: Date,
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
GroupPollSchema.index({ groupId: 1, createdAt: -1 });
GroupPollSchema.index({ messageId: 1 });
GroupPollSchema.index({ createdBy: 1 });
GroupPollSchema.index({ expiresAt: 1 });

const GroupPoll = mongoose.models.GroupPoll || mongoose.model('GroupPoll', GroupPollSchema);

export default GroupPoll;

