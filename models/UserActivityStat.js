import mongoose, { Schema } from 'mongoose';

const UserActivityStatSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    totalMessagesSent: {
      type: Number,
      default: 0,
    },
    totalMessagesReceived: {
      type: Number,
      default: 0,
    },
    averageResponseTime: {
      type: Number, // in seconds
      default: 0,
    },
    responseTimes: [Number], // array of response times in seconds
    activeHours: [{
      hour: Number, // 0-23
      messageCount: Number,
      loginCount: Number,
    }],
    chatsParticipated: [{
      chatId: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
      },
      messageCount: Number,
    }],
    groupsParticipated: [{
      groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
      },
      messageCount: Number,
    }],
    engagementScore: {
      type: Number, // 0-100
      default: 0,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    sessionDuration: {
      type: Number, // in seconds
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

UserActivityStatSchema.index({ user: 1, date: -1 });
UserActivityStatSchema.index({ date: -1 });
UserActivityStatSchema.index({ engagementScore: -1 });

const UserActivityStat = mongoose.models.UserActivityStat || mongoose.model('UserActivityStat', UserActivityStatSchema);

export default UserActivityStat;

