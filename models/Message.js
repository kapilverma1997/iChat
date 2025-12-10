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
});

const AttachmentSchema = new Schema({
  fileId: {
    type: Schema.Types.ObjectId,
    ref: 'File',
  },
  url: String,
  thumbnail: String,
  type: String,
  name: String,
  size: Number,
});

const MessageSchema = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'text',
        'emoji',
        'gif',
        'sticker',
        'image',
        'video',
        'file',
        'voice',
        'location',
        'contact',
        'code',
        'markdown',
        'audio',
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
    reactions: [ReactionSchema],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    quotedMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    isStarred: {
      type: Boolean,
      default: false,
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
    deletedFor: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['normal', 'important', 'urgent'],
      default: 'normal',
    },
    tags: [
      {
        type: String,
        enum: ['important', 'todo', 'reminder'],
      },
    ],
    scheduledAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    forwardedFrom: {
      messageId: {
        type: Schema.Types.ObjectId,
        ref: 'Message',
      },
      chatId: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
      },
      groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
      },
    },
    translation: {
      language: String,
      content: String,
    },
    attachments: [AttachmentSchema],
    deliveredAt: {
      type: Date,
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
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ isDeleted: 1 });
MessageSchema.index({ isPinned: 1 });
MessageSchema.index({ isStarred: 1 });
MessageSchema.index({ priority: 1 });
MessageSchema.index({ tags: 1 });
MessageSchema.index({ scheduledAt: 1 });
MessageSchema.index({ expiresAt: 1 });
MessageSchema.index({ 'forwardedFrom.messageId': 1 });

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

export default Message;
