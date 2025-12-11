import mongoose, { Schema } from 'mongoose';

const CompressionLogSchema = new Schema(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      index: true,
    },
    originalSize: {
      type: Number, // in bytes
      required: true,
    },
    compressedSize: {
      type: Number, // in bytes
      required: true,
    },
    compressionRatio: {
      type: Number, // percentage
      required: true,
    },
    compressionType: {
      type: String,
      enum: ['gzip', 'brotli', 'deflate'],
      default: 'gzip',
    },
    compressedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

CompressionLogSchema.index({ messageId: 1 });
CompressionLogSchema.index({ compressedAt: -1 });

const CompressionLog = mongoose.models.CompressionLog || mongoose.model('CompressionLog', CompressionLogSchema);

export default CompressionLog;

