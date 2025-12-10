import mongoose, { Schema } from 'mongoose';

const ChatSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    wallpaper: {
      type: String,
      default: '',
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
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
ChatSchema.index({ participants: 1 });
ChatSchema.index({ lastMessageAt: -1 });
ChatSchema.index({ isArchived: 1, isPinned: -1 });

// Ensure unique chat between two participants
ChatSchema.index({ participants: 1 }, { unique: true, sparse: true });

const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);

export default Chat;
