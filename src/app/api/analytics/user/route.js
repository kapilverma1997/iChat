import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth.js';
import UserActivityStat from '../../../../models/UserActivityStat.js';
import MessageStat from '../../../../models/MessageStat.js';
import connectDB from '../../../../lib/mongodb.js';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user._id.toString();
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    } else {
      // Default to last 30 days
      const defaultEnd = new Date();
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 30);
      dateFilter.date = { $gte: defaultStart, $lte: defaultEnd };
    }

    // Get user activity stats
    const activityStats = await UserActivityStat.find({
      user: userId,
      ...dateFilter,
    }).sort({ date: -1 });

    // Calculate totals
    const totals = {
      totalMessagesSent: 0,
      totalMessagesReceived: 0,
      totalResponseTime: 0,
      responseTimeCount: 0,
      totalEngagementScore: 0,
      daysActive: activityStats.length,
    };

    activityStats.forEach((stat) => {
      totals.totalMessagesSent += stat.totalMessagesSent || 0;
      totals.totalMessagesReceived += stat.totalMessagesReceived || 0;
      if (stat.averageResponseTime > 0) {
        totals.totalResponseTime += stat.averageResponseTime;
        totals.responseTimeCount++;
      }
      totals.totalEngagementScore += stat.engagementScore || 0;
    });

    const averageResponseTime = totals.responseTimeCount > 0
      ? totals.totalResponseTime / totals.responseTimeCount
      : 0;

    const averageEngagementScore = activityStats.length > 0
      ? totals.totalEngagementScore / activityStats.length
      : 0;

    // Get messages per chat
    const messageStats = await MessageStat.find({
      userId,
      ...dateFilter,
    }).populate('chatId', 'otherUser').populate('groupId', 'name');

    const messagesPerChat = {};
    messageStats.forEach((stat) => {
      const key = stat.chatId ? `chat_${stat.chatId._id}` : `group_${stat.groupId._id}`;
      if (!messagesPerChat[key]) {
        messagesPerChat[key] = {
          id: stat.chatId?._id || stat.groupId?._id,
          name: stat.chatId?.otherUser?.name || stat.groupId?.name,
          type: stat.chatId ? 'chat' : 'group',
          count: 0,
        };
      }
      messagesPerChat[key].count += stat.messageCount || 0;
    });

    // Get active hours
    const activeHours = Array(24).fill(0);
    activityStats.forEach((stat) => {
      if (stat.activeHours) {
        stat.activeHours.forEach((hourData) => {
          activeHours[hourData.hour] += hourData.messageCount || 0;
        });
      }
    });

    return NextResponse.json({
      userId,
      period,
      totals: {
        messagesSent: totals.totalMessagesSent,
        messagesReceived: totals.totalMessagesReceived,
        averageResponseTime: Math.round(averageResponseTime),
        engagementScore: Math.round(averageEngagementScore * 10) / 10,
        daysActive: totals.daysActive,
      },
      messagesPerChat: Object.values(messagesPerChat),
      activeHours,
      dailyStats: activityStats.map((stat) => ({
        date: stat.date,
        messagesSent: stat.totalMessagesSent,
        messagesReceived: stat.totalMessagesReceived,
        engagementScore: stat.engagementScore,
        averageResponseTime: stat.averageResponseTime,
      })),
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch user analytics' }, { status: 500 });
  }
}

