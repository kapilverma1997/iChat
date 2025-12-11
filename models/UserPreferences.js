import mongoose, { Schema } from 'mongoose';

const UserPreferencesSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'blue', 'green', 'high-contrast'],
      default: 'light',
    },
    customTheme: {
      primaryColor: String,
      secondaryColor: String,
      backgroundColor: String,
      textColor: String,
    },
    chatBackgrounds: [{
      chatId: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
      },
      groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
      },
      backgroundUrl: String,
      backgroundType: {
        type: String,
        enum: ['uploaded', 'predefined'],
      },
    }],
    defaultChatBackground: {
      type: String,
      default: '',
    },
    statusDuration: {
      type: Number, // minutes
      enum: [30, 60, 480, null], // 30 min, 1 hour, 8 hours, custom
      default: null,
    },
    customStatusDuration: {
      type: Number, // minutes, used when statusDuration is null
    },
    emojiPreferences: {
      skinTone: {
        type: String,
        default: 'default',
      },
      frequentlyUsed: [String],
    },
    notificationSounds: {
      enabled: {
        type: Boolean,
        default: true,
      },
      customSound: String,
    },
    uiPreferences: {
      compactMode: {
        type: Boolean,
        default: false,
      },
      showAvatars: {
        type: Boolean,
        default: true,
      },
      showTimestamps: {
        type: Boolean,
        default: true,
      },
      messageDensity: {
        type: String,
        enum: ['comfortable', 'compact', 'compact'],
        default: 'comfortable',
      },
    },
  },
  {
    timestamps: true,
  }
);

const UserPreferences = mongoose.models.UserPreferences || mongoose.model('UserPreferences', UserPreferencesSchema);

export default UserPreferences;

