import mongoose, { Schema } from 'mongoose';

const NoteSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
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
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedAt: {
      type: Date,
    },
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    collaborators: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      role: {
        type: String,
        enum: ['viewer', 'editor', 'owner'],
        default: 'editor',
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    versionHistory: [{
      version: Number,
      content: String,
      editedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      editedAt: {
        type: Date,
        default: Date.now,
      },
      changeSummary: String,
    }],
    currentVersion: {
      type: Number,
      default: 1,
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
  },
  {
    timestamps: true,
  }
);

NoteSchema.index({ chatId: 1, createdAt: -1 });
NoteSchema.index({ groupId: 1, createdAt: -1 });
NoteSchema.index({ createdBy: 1 });
NoteSchema.index({ isPinned: 1, pinnedAt: -1 });

const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);

export default Note;

