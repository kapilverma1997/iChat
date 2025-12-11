import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth.js';
import WorkspaceAnalytics from '../../../../models/WorkspaceAnalytics.js';
import UserActivityStat from '../../../../models/UserActivityStat.js';
import GroupActivityStat from '../../../../models/GroupActivityStat.js';
import { isAdmin } from '../../../../lib/adminAuth.js';
import connectDB from '../../../../lib/mongodb.js';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await isAdmin(user._id);
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let filter = { period };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    } else {
      // Get latest analytics
      const latest = await WorkspaceAnalytics.findOne({ period })
        .sort({ date: -1 });
      if (latest) {
        filter.date = { $gte: latest.date };
      }
    }

    const workspaceStats = await WorkspaceAnalytics.find(filter)
      .sort({ date: -1 })
      .limit(30);

    if (workspaceStats.length === 0) {
      // Generate basic stats if none exist
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get user activity stats
      const userStats = await UserActivityStat.find({
        date: { $gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) },
      });

      // Get group activity stats
      const groupStats = await GroupActivityStat.find({
        date: { $gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) },
      });

      // Calculate basic metrics
      const totalMessages = userStats.reduce((sum, stat) => 
        sum + (stat.totalMessagesSent || 0), 0);
      const uniqueUsers = new Set(userStats.map(s => s.user.toString())).size;
      const uniqueGroups = new Set(groupStats.map(s => s.group.toString())).size;

      return NextResponse.json({
        period,
        totals: {
          totalMessages,
          totalUsers: uniqueUsers,
          activeUsers: uniqueUsers,
          totalGroups: uniqueGroups,
          activeGroups: uniqueGroups,
        },
        messagesPerDay: [],
        peakUsageHours: Array(24).fill(0).map((_, hour) => ({ hour, messageCount: 0, userCount: 0 })),
        employeeEngagement: {
          averageDailyUsage: 0,
          averageMessagesPerUser: 0,
          averageActiveTime: 0,
          departmentParticipation: [],
        },
        mostActiveGroups: [],
      });
    }

    const latest = workspaceStats[0];

    return NextResponse.json({
      period,
      totals: {
        totalMessages: latest.totalMessages || 0,
        totalUsers: latest.totalUsers || 0,
        activeUsers: latest.activeUsers || 0,
        totalGroups: latest.totalGroups || 0,
        activeGroups: latest.activeGroups || 0,
        totalStorage: latest.totalStorage || 0,
      },
      messagesPerDay: latest.messagesPerDay || [],
      messagesPerGroup: latest.messagesPerGroup || [],
      messagesPerChannel: latest.messagesPerChannel || [],
      mediaVsText: latest.mediaVsText || { media: 0, text: 0 },
      peakUsageHours: latest.peakUsageHours || [],
      employeeEngagement: latest.employeeEngagement || {
        averageDailyUsage: 0,
        averageMessagesPerUser: 0,
        averageActiveTime: 0,
        departmentParticipation: [],
      },
      mostActiveGroups: latest.mostActiveGroups || [],
      historicalData: workspaceStats.map((stat) => ({
        date: stat.date,
        totalMessages: stat.totalMessages,
        activeUsers: stat.activeUsers,
        activeGroups: stat.activeGroups,
      })),
    });
  } catch (error) {
    console.error('Error fetching workspace analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch workspace analytics' }, { status: 500 });
  }
}

