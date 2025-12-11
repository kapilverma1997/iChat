import mongoose, { Schema } from 'mongoose';

const AnnouncementSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'urgent', 'maintenance'],
      default: 'info',
    },
    targetAudience: {
      type: String,
      enum: ['all', 'employees', 'managers', 'admins', 'custom'],
      default: 'all',
    },
    targetUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    targetDepartments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    attachments: [
      {
        fileId: {
          type: Schema.Types.ObjectId,
          ref: 'File',
        },
        fileName: String,
        fileUrl: String,
      },
    ],
    scheduledAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    readBy: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
  },
  {
    timestamps: true,
  }
);

AnnouncementSchema.index({ isPublished: 1, scheduledAt: 1 });
AnnouncementSchema.index({ createdBy: 1, createdAt: -1 });
AnnouncementSchema.index({ targetAudience: 1 });
AnnouncementSchema.index({ expiresAt: 1 });

const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);

export default Announcement;

