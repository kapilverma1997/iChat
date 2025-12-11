import mongoose, { Schema } from 'mongoose';

const WorkspaceAnalyticsSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily',
      index: true,
    },
    totalMessages: {
      type: Number,
      default: 0,
    },
    totalUsers: {
      type: Number,
      default: 0,
    },
    activeUsers: {
      type: Number,
      default: 0,
    },
    totalGroups: {
      type: Number,
      default: 0,
    },
    activeGroups: {
      type: Number,
      default: 0,
    },
    totalStorage: {
      type: Number, // in bytes
      default: 0,
    },
    messagesPerDay: [{
      day: Date,
      count: Number,
    }],
    messagesPerGroup: [{
      groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
      },
      count: Number,
    }],
    messagesPerChannel: [{
      channelId: String,
      count: Number,
    }],
    mediaVsText: {
      media: Number,
      text: Number,
    },
    peakUsageHours: [{
      hour: Number, // 0-23
      messageCount: Number,
      userCount: Number,
    }],
    employeeEngagement: {
      averageDailyUsage: Number, // in minutes
      averageMessagesPerUser: Number,
      averageActiveTime: Number, // in minutes
      departmentParticipation: [{
        department: String,
        messageCount: Number,
        userCount: Number,
        averageMessagesPerUser: Number,
      }],
    },
    mostActiveGroups: [{
      groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
      },
      messageCount: Number,
      engagementScore: Number,
      mediaUploads: Number,
    }],
  },
  {
    timestamps: true,
  }
);

WorkspaceAnalyticsSchema.index({ date: -1, period: 1 });
WorkspaceAnalyticsSchema.index({ period: 1, date: -1 });

const WorkspaceAnalytics = mongoose.models.WorkspaceAnalytics || mongoose.model('WorkspaceAnalytics', WorkspaceAnalyticsSchema);

export default WorkspaceAnalytics;

