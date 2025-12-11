import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth.js';
import MessageStat from '../../../../models/MessageStat.js';
import Message from '../../../../models/Message.js';
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'daily';

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    } else {
      const defaultEnd = new Date();
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 30);
      dateFilter.date = { $gte: defaultStart, $lte: defaultEnd };
    }

    // Get message statistics
    const messageStats = await MessageStat.find(dateFilter).sort({ date: -1 });

    // Aggregate totals
    const totals = {
      totalMessages: 0,
      textMessages: 0,
      mediaMessages: 0,
      fileMessages: 0,
      reactionsCount: 0,
    };

    const messagesPerDay = {};
    const messagesPerGroup = {};
    const messagesPerChat = {};

    messageStats.forEach((stat) => {
      totals.totalMessages += stat.messageCount || 0;
      totals.textMessages += stat.textMessages || 0;
      totals.mediaMessages += stat.mediaMessages || 0;
      totals.fileMessages += stat.fileMessages || 0;
      totals.reactionsCount += stat.reactionsCount || 0;

      const dateKey = stat.date.toISOString().split('T')[0];
      messagesPerDay[dateKey] = (messagesPerDay[dateKey] || 0) + (stat.messageCount || 0);

      if (stat.groupId) {
        const groupId = stat.groupId.toString();
        messagesPerGroup[groupId] = (messagesPerGroup[groupId] || 0) + (stat.messageCount || 0);
      }

      if (stat.chatId) {
        const chatId = stat.chatId.toString();
        messagesPerChat[chatId] = (messagesPerChat[chatId] || 0) + (stat.messageCount || 0);
      }
    });

    // Get messages per day array
    const messagesPerDayArray = Object.entries(messagesPerDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get top groups
    const topGroups = await MessageStat.aggregate([
      { $match: { ...dateFilter, groupId: { $exists: true } } },
      {
        $group: {
          _id: '$groupId',
          totalMessages: { $sum: '$messageCount' },
        },
      },
      { $sort: { totalMessages: -1 } },
      { $limit: 10 },
    ]);

    // Get media vs text ratio
    const mediaVsText = {
      media: totals.mediaMessages + totals.fileMessages,
      text: totals.textMessages,
    };

    return NextResponse.json({
      period,
      totals,
      messagesPerDay: messagesPerDayArray,
      messagesPerGroup: Object.entries(messagesPerGroup).map(([groupId, count]) => ({
        groupId,
        count,
      })),
      messagesPerChat: Object.entries(messagesPerChat).map(([chatId, count]) => ({
        chatId,
        count,
      })),
      topGroups: topGroups.map((g) => ({
        groupId: g._id,
        totalMessages: g.totalMessages,
      })),
      mediaVsText,
    });
  } catch (error) {
    console.error('Error fetching message analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch message analytics' }, { status: 500 });
  }
}

