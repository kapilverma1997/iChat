import mongoose, { Schema } from 'mongoose';

const LanguagePreferencesSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    language: {
      type: String,
      default: 'en',
    },
    autoDetect: {
      type: Boolean,
      default: true,
    },
    detectedLanguage: {
      type: String,
    },
    rtlEnabled: {
      type: Boolean,
      default: false,
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY',
    },
    timeFormat: {
      type: String,
      enum: ['12h', '24h'],
      default: '12h',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
  },
  {
    timestamps: true,
  }
);

const LanguagePreferences = mongoose.models.LanguagePreferences || mongoose.model('LanguagePreferences', LanguagePreferencesSchema);

export default LanguagePreferences;

