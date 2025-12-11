import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import StorageAnalytics from '../../../../../models/StorageAnalytics.js';
import User from '../../../../../models/User.js';
import Chat from '../../../../../models/Chat.js';
import Group from '../../../../../models/Group.js';

export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('groupBy') || 'fileType'; // fileType, userId, chatId, date

    // Total storage stats
    const totalStats = await StorageAnalytics.aggregate([
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$fileSize' },
          totalFiles: { $sum: '$fileCount' },
          totalDownloads: { $sum: '$downloadCount' },
        },
      },
    ]);

    // Storage by file type
    const byFileType = await StorageAnalytics.aggregate([
      {
        $group: {
          _id: '$fileType',
          totalSize: { $sum: '$fileSize' },
          fileCount: { $sum: '$fileCount' },
          downloadCount: { $sum: '$downloadCount' },
        },
      },
      {
        $sort: { totalSize: -1 },
      },
    ]);

    // Storage by user
    const byUser = await StorageAnalytics.aggregate([
      {
        $match: { userId: { $exists: true, $ne: null } },
      },
      {
        $group: {
          _id: '$userId',
          totalSize: { $sum: '$fileSize' },
          fileCount: { $sum: '$fileCount' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          totalSize: 1,
          fileCount: 1,
          userName: '$user.name',
          userEmail: '$user.email',
        },
      },
      {
        $sort: { totalSize: -1 },
      },
      {
        $limit: 20,
      },
    ]);

    // Storage by chat
    const byChat = await StorageAnalytics.aggregate([
      {
        $match: { chatId: { $exists: true, $ne: null } },
      },
      {
        $group: {
          _id: '$chatId',
          totalSize: { $sum: '$fileSize' },
          fileCount: { $sum: '$fileCount' },
        },
      },
      {
        $sort: { totalSize: -1 },
      },
      {
        $limit: 20,
      },
    ]);

    // Storage trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trends = await StorageAnalytics.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          totalSize: { $sum: '$fileSize' },
          fileCount: { $sum: '$fileCount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return NextResponse.json({
      total: {
        size: totalStats[0]?.totalSize || 0,
        files: totalStats[0]?.totalFiles || 0,
        downloads: totalStats[0]?.totalDownloads || 0,
      },
      byFileType,
      byUser,
      byChat,
      trends,
    });
  } catch (error) {
    console.error('Storage analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch storage analytics' },
      { status: 500 }
    );
  }
}

