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
    // E2EE Keys
    publicKey: {
      type: String,
      select: false,
    },
    privateKeyEncrypted: {
      type: String,
      select: false, // Encrypted with user's password
    },
    // Two-step verification backup codes
    backupCodes: [
      {
        code: {
          type: String,
          select: false,
        },
        used: {
          type: Boolean,
          default: false,
        },
      },
    ],
    trustedDevices: [
      {
        deviceId: String,
        deviceName: String,
        trustedAt: Date,
      },
    ],
    // Notification preferences
    notificationPreferences: {
      pushEnabled: {
        type: Boolean,
        default: true,
      },
      emailEnabled: {
        type: Boolean,
        default: true,
      },
      categories: {
        mentions: { type: Boolean, default: true },
        directMessages: { type: Boolean, default: true },
        replies: { type: Boolean, default: true },
        fileUploads: { type: Boolean, default: true },
        system: { type: Boolean, default: true },
        adminAlerts: { type: Boolean, default: true },
        groupInvites: { type: Boolean, default: true },
      },
      emailDigestInterval: {
        type: Number, // minutes
        default: 60,
      },
      customSound: {
        type: String,
        default: '',
      },
    },
    // Push notification subscription
    pushSubscription: {
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String,
      },
    },
    // Chat security settings
    chatSecurity: {
      screenshotBlocking: {
        type: Boolean,
        default: false,
      },
      watermarkEnabled: {
        type: Boolean,
        default: false,
      },
      disableCopy: {
        type: Boolean,
        default: false,
      },
      disableForward: {
        type: Boolean,
        default: false,
      },
      disableDownload: {
        type: Boolean,
        default: false,
      },
    },
    // User role for RBAC
    role: {
      type: String,
      enum: ['owner', 'admin', 'moderator', 'employee', 'guest', 'read-only'],
      default: 'employee',
    },
    // Chat restrictions (set by admin)
    chatRestrictions: {
      disabled: {
        type: Boolean,
        default: false,
      },
      disableSending: {
        type: Boolean,
        default: false,
      },
      disableCalling: {
        type: Boolean,
        default: false,
      },
      disableFileUpload: {
        type: Boolean,
        default: false,
      },
      disableGroupCreation: {
        type: Boolean,
        default: false,
      },
      disabledAt: {
        type: Date,
      },
      disabledBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    // User active status
    isActive: {
      type: Boolean,
      default: true,
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
