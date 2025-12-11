import mongoose, { Schema } from 'mongoose';

const DocumentSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    content: {
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
    collaborators: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      role: {
        type: String,
        enum: ['viewer', 'commenter', 'editor', 'owner'],
        default: 'editor',
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    cursorPositions: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      position: Number,
      color: String,
      name: String,
      lastSeen: {
        type: Date,
        default: Date.now,
      },
    }],
    currentVersion: {
      type: Number,
      default: 1,
    },
    format: {
      type: String,
      enum: ['text', 'markdown', 'html'],
      default: 'text',
    },
    cloudStorage: {
      provider: {
        type: String,
        enum: ['drive', 'onedrive', 'dropbox', 'none'],
        default: 'none',
      },
      fileId: String,
      syncEnabled: {
        type: Boolean,
        default: false,
      },
      lastSyncedAt: Date,
    },
    exportSettings: {
      pdfEnabled: {
        type: Boolean,
        default: true,
      },
      wordEnabled: {
        type: Boolean,
        default: true,
      },
    },
    tags: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

DocumentSchema.index({ chatId: 1, createdAt: -1 });
DocumentSchema.index({ groupId: 1, createdAt: -1 });
DocumentSchema.index({ createdBy: 1 });

const Document = mongoose.models.Document || mongoose.model('Document', DocumentSchema);

export default Document;

