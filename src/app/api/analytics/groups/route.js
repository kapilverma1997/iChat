import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth.js';
import GroupActivityStat from '../../../../models/GroupActivityStat.js';
import Group from '../../../../models/Group.js';
import connectDB from '../../../../lib/mongodb.js';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let filter = {};
    if (groupId) {
      filter.group = groupId;
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const groupStats = await GroupActivityStat.find(filter)
      .populate('group', 'name description')
      .populate('activeMembers.user', 'name email profilePhoto')
      .sort({ date: -1 });

    if (groupId && groupStats.length === 0) {
      return NextResponse.json({ error: 'Group not found or no stats available' }, { status: 404 });
    }

    // Calculate totals
    const totals = {
      totalMessages: 0,
      mediaUploads: 0,
      fileUploads: 0,
      averageEngagementScore: 0,
    };

    const peakHours = Array(24).fill(0);
    const activeMembersMap = {};

    groupStats.forEach((stat) => {
      totals.totalMessages += stat.totalMessages || 0;
      totals.mediaUploads += stat.mediaUploads || 0;
      totals.fileUploads += stat.fileUploads || 0;
      totals.averageEngagementScore += stat.engagementScore || 0;

      if (stat.peakHours) {
        stat.peakHours.forEach((hourData) => {
          peakHours[hourData.hour] += hourData.messageCount || 0;
        });
      }

      if (stat.activeMembers) {
        stat.activeMembers.forEach((member) => {
          const userId = member.user?._id?.toString();
          if (userId) {
            if (!activeMembersMap[userId]) {
              activeMembersMap[userId] = {
                user: member.user,
                messageCount: 0,
                lastActiveAt: null,
              };
            }
            activeMembersMap[userId].messageCount += member.messageCount || 0;
            if (!activeMembersMap[userId].lastActiveAt || 
                new Date(member.lastActiveAt) > new Date(activeMembersMap[userId].lastActiveAt)) {
              activeMembersMap[userId].lastActiveAt = member.lastActiveAt;
            }
          }
        });
      }
    });

    totals.averageEngagementScore = groupStats.length > 0
      ? totals.averageEngagementScore / groupStats.length
      : 0;

    const activeMembers = Object.values(activeMembersMap)
      .sort((a, b) => b.messageCount - a.messageCount);

    return NextResponse.json({
      groupId,
      totals: {
        ...totals,
        averageEngagementScore: Math.round(totals.averageEngagementScore * 10) / 10,
      },
      peakHours: peakHours.map((count, hour) => ({ hour, count })),
      activeMembers: activeMembers.slice(0, 20), // Top 20
      dailyStats: groupStats.map((stat) => ({
        date: stat.date,
        totalMessages: stat.totalMessages,
        mediaUploads: stat.mediaUploads,
        fileUploads: stat.fileUploads,
        engagementScore: stat.engagementScore,
      })),
    });
  } catch (error) {
    console.error('Error fetching group analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch group analytics' }, { status: 500 });
  }
}

