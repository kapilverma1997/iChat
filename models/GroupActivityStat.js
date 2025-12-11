import mongoose, { Schema } from 'mongoose';

const GroupActivityStatSchema = new Schema(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    totalMessages: {
      type: Number,
      default: 0,
    },
    activeMembers: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      messageCount: Number,
      lastActiveAt: Date,
    }],
    mediaUploads: {
      type: Number,
      default: 0,
    },
    fileUploads: {
      type: Number,
      default: 0,
    },
    engagementScore: {
      type: Number, // 0-100
      default: 0,
    },
    peakHours: [{
      hour: Number, // 0-23
      messageCount: Number,
    }],
    departmentBreakdown: [{
      department: String,
      messageCount: Number,
      memberCount: Number,
    }],
  },
  {
    timestamps: true,
  }
);

GroupActivityStatSchema.index({ group: 1, date: -1 });
GroupActivityStatSchema.index({ date: -1 });
GroupActivityStatSchema.index({ engagementScore: -1 });

const GroupActivityStat = mongoose.models.GroupActivityStat || mongoose.model('GroupActivityStat', GroupActivityStatSchema);

export default GroupActivityStat;

