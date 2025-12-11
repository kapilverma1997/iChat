import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import ActiveUser from '../../../../../models/ActiveUser.js';
import Message from '../../../../../models/Message.js';

export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Activity by hour and day of week
    const activityData = await ActiveUser.aggregate([
      {
        $match: {
          lastActivityAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$lastActivityAt' },
            dayOfWeek: { $dayOfWeek: '$lastActivityAt' },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Message activity by hour
    const messageActivity = await Message.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Activity by day
    const dailyActivity = await ActiveUser.aggregate([
      {
        $match: {
          lastActivityAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$lastActivityAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Peak hours
    const peakHours = await ActiveUser.aggregate([
      {
        $match: {
          lastActivityAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $hour: '$lastActivityAt' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    return NextResponse.json({
      activityData,
      messageActivity,
      dailyActivity,
      peakHours,
    });
  } catch (error) {
    console.error('Usage heatmap error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch usage heatmap' },
      { status: 500 }
    );
  }
}

