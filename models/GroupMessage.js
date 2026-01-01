import mongoose, { Schema } from 'mongoose';

const ReactionSchema = new Schema({
  emoji: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MentionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['user', 'everyone'],
    default: 'user',
  },
});

const GroupMessageSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: false,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'text',
        'image',
        'video',
        'file',
        'audio',
        'voice',
        'location',
        'contact',
        'poll',
        'event',
        'system',
        'code',
        'markdown',
        'emoji',
      ],
      default: 'text',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    mentions: [MentionSchema],
    reactions: [ReactionSchema],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'GroupMessage',
    },
    threadId: {
      type: Schema.Types.ObjectId,
      ref: 'GroupMessage',
    },
    threadCount: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    readBy: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
GroupMessageSchema.index({ groupId: 1, createdAt: -1 });
GroupMessageSchema.index({ senderId: 1 });
GroupMessageSchema.index({ threadId: 1 });
GroupMessageSchema.index({ replyTo: 1 });
GroupMessageSchema.index({ isDeleted: 1 });
GroupMessageSchema.index({ isPinned: 1 });
GroupMessageSchema.index({ type: 1 });

const GroupMessage = mongoose.models.GroupMessage || mongoose.model('GroupMessage', GroupMessageSchema);

export default GroupMessage;

