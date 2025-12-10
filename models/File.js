import mongoose, { Schema } from 'mongoose';

const FileSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    metadata: {
      size: {
        type: Number,
        default: 0,
      },
      type: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      mimeType: String,
      width: Number,
      height: Number,
      duration: Number, // For videos/audio
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    expiresAt: {
      type: Date,
    },
    cloudStorage: {
      provider: {
        type: String,
        enum: ['google-drive', 'onedrive', 'dropbox', 'local'],
        default: 'local',
      },
      cloudUrl: String,
      cloudFileId: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
FileSchema.index({ uploadedBy: 1, createdAt: -1 });
FileSchema.index({ chatId: 1 });
FileSchema.index({ groupId: 1 });
FileSchema.index({ expiresAt: 1 });
FileSchema.index({ 'metadata.type': 1 });

const File = mongoose.models.File || mongoose.model('File', FileSchema);

export default File;

