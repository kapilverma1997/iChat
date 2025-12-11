import mongoose, { Schema } from 'mongoose';

const ThumbnailSchema = new Schema(
  {
    originalFileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      required: true,
      index: true,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      index: true,
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    thumbnailSize: {
      width: Number,
      height: Number,
    },
    fileSize: {
      type: Number, // in bytes
    },
    format: {
      type: String,
      enum: ['jpg', 'png', 'webp'],
      default: 'jpg',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    storageProvider: {
      type: String,
      enum: ['local', 's3', 'cloudinary'],
      default: 'local',
    },
  },
  {
    timestamps: true,
  }
);

ThumbnailSchema.index({ originalFileId: 1 });
ThumbnailSchema.index({ messageId: 1 });

const Thumbnail = mongoose.models.Thumbnail || mongoose.model('Thumbnail', ThumbnailSchema);

export default Thumbnail;

