import mongoose, { Schema } from 'mongoose';

const WhiteboardSchema = new Schema(
  {
    title: {
      type: String,
      default: 'Untitled Whiteboard',
      trim: true,
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
        enum: ['viewer', 'editor', 'owner'],
        default: 'editor',
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    canvasData: {
      type: String, // JSON stringified canvas state
      default: '{}',
    },
    images: [{
      url: String,
      fileName: String,
      position: {
        x: Number,
        y: Number,
      },
      width: Number,
      height: Number,
      uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    cursorPositions: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      x: Number,
      y: Number,
      color: String,
      name: String,
      lastSeen: {
        type: Date,
        default: Date.now,
      },
    }],
    settings: {
      backgroundColor: {
        type: String,
        default: '#ffffff',
      },
      gridEnabled: {
        type: Boolean,
        default: false,
      },
      snapToGrid: {
        type: Boolean,
        default: false,
      },
    },
    exportHistory: [{
      format: {
        type: String,
        enum: ['png', 'jpg', 'pdf'],
      },
      url: String,
      exportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      exportedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

WhiteboardSchema.index({ chatId: 1, createdAt: -1 });
WhiteboardSchema.index({ groupId: 1, createdAt: -1 });
WhiteboardSchema.index({ createdBy: 1 });

const Whiteboard = mongoose.models.Whiteboard || mongoose.model('Whiteboard', WhiteboardSchema);

export default Whiteboard;

