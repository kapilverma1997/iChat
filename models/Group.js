import mongoose, { Schema } from 'mongoose';

const GroupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    groupPhoto: {
      type: String,
      default: '',
    },
    welcomeMessage: {
      type: String,
      trim: true,
      maxlength: [200, 'Welcome message cannot exceed 200 characters'],
      default: '',
    },
    groupType: {
      type: String,
      enum: ['public', 'private', 'announcement'],
      default: 'public',
    },
    members: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['owner', 'admin', 'moderator', 'member', 'read-only'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        isMuted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    joinRequests: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
      },
    ],
    bannedUsers: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        bannedAt: {
          type: Date,
          default: Date.now,
        },
        bannedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        reason: {
          type: String,
          default: '',
        },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    settings: {
      onlyAdminsSendFiles: {
        type: Boolean,
        default: false,
      },
      onlyAdminsCreatePolls: {
        type: Boolean,
        default: false,
      },
      onlyAdminsChangeInfo: {
        type: Boolean,
        default: false,
      },
      allowReactions: {
        type: Boolean,
        default: true,
      },
      allowReplies: {
        type: Boolean,
        default: true,
      },
      muted: {
        type: Boolean,
        default: false,
      },
      readOnly: {
        type: Boolean,
        default: false,
      },
    },
    pinnedMessages: [
      {
        messageId: {
          type: Schema.Types.ObjectId,
          ref: 'GroupMessage',
        },
        pinnedAt: {
          type: Date,
          default: Date.now,
        },
        pinnedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'GroupMessage',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
GroupSchema.index({ 'members.userId': 1 });
GroupSchema.index({ groupType: 1 });
GroupSchema.index({ createdBy: 1 });
GroupSchema.index({ lastMessageAt: -1 });
GroupSchema.index({ name: 'text', description: 'text' });

const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);

export default Group;

