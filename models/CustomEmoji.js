import mongoose, { Schema } from 'mongoose';

const CustomEmojiSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Emoji name is required'],
      trim: true,
      unique: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      index: true,
    },
    isGlobal: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      default: 'custom',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    usageCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

CustomEmojiSchema.index({ groupId: 1, isActive: 1 });
CustomEmojiSchema.index({ isGlobal: 1, isActive: 1 });
CustomEmojiSchema.index({ usageCount: -1 });

const CustomEmoji = mongoose.models.CustomEmoji || mongoose.model('CustomEmoji', CustomEmojiSchema);

export default CustomEmoji;

