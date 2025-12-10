import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number'],
    },
    passwordHash: {
      type: String,
      select: false, // Don't include password in queries by default
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    designation: {
      type: String,
      trim: true,
      default: '',
    },
    statusMessage: {
      type: String,
      trim: true,
      maxlength: [100, 'Status message cannot exceed 100 characters'],
      default: '',
    },
    presenceStatus: {
      type: String,
      enum: ['online', 'offline', 'away', 'do-not-disturb'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'custom'],
      default: 'light',
    },
    customTheme: {
      type: String,
      default: '',
    },
    chatWallpaper: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'en',
    },
    privacySettings: {
      showProfilePhoto: {
        type: Boolean,
        default: true,
      },
      showLastSeen: {
        type: Boolean,
        default: true,
      },
      showStatus: {
        type: Boolean,
        default: true,
      },
      showDesignation: {
        type: Boolean,
        default: true,
      },
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorType: {
      type: String,
      enum: ['sms', 'email', 'authenticator'],
    },
    otpSecret: {
      type: String,
      select: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ presenceStatus: 1 });
UserSchema.index({ lastSeen: 1 });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
