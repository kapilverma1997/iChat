import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth.js';
import FileUsageStat from '../../../../models/FileUsageStat.js';
import File from '../../../../models/File.js';
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
    const userId = searchParams.get('userId');
    const chatId = searchParams.get('chatId');
    const groupId = searchParams.get('groupId');

    let filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (userId) filter.userId = userId;
    if (chatId) filter.chatId = chatId;
    if (groupId) filter.groupId = groupId;

    // Get file usage statistics
    const fileStats = await FileUsageStat.find(filter).sort({ date: -1 });

    // Aggregate totals
    const totals = {
      totalStorage: 0,
      totalUploads: 0,
      totalDownloads: 0,
      storageByType: {
        image: 0,
        video: 0,
        audio: 0,
        document: 0,
        other: 0,
      },
    };

    const storagePerUser = {};
    const storagePerChat = {};
    const uploadsPerDay = {};

    fileStats.forEach((stat) => {
      totals.totalStorage += stat.storageUsed || 0;
      totals.totalUploads += stat.uploadCount || 0;
      totals.totalDownloads += stat.downloadCount || 0;

      if (stat.fileType && totals.storageByType[stat.fileType] !== undefined) {
        totals.storageByType[stat.fileType] += stat.storageUsed || 0;
      }

      if (stat.userId) {
        const userId = stat.userId.toString();
        storagePerUser[userId] = (storagePerUser[userId] || 0) + (stat.storageUsed || 0);
      }

      if (stat.chatId) {
        const chatId = stat.chatId.toString();
        storagePerChat[chatId] = (storagePerChat[chatId] || 0) + (stat.storageUsed || 0);
      }

      const dateKey = stat.date.toISOString().split('T')[0];
      uploadsPerDay[dateKey] = (uploadsPerDay[dateKey] || 0) + (stat.uploadCount || 0);
    });

    // Get top users by storage
    const topUsers = await FileUsageStat.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$userId',
          totalStorage: { $sum: '$storageUsed' },
          totalUploads: { $sum: '$uploadCount' },
        },
      },
      { $sort: { totalStorage: -1 } },
      { $limit: 10 },
    ]);

    // Get file type distribution
    const fileTypeDistribution = await FileUsageStat.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$fileType',
          count: { $sum: '$uploadCount' },
          totalSize: { $sum: '$storageUsed' },
        },
      },
    ]);

    return NextResponse.json({
      totals: {
        ...totals,
        totalStorageFormatted: formatBytes(totals.totalStorage),
      },
      storagePerUser: Object.entries(storagePerUser).map(([userId, size]) => ({
        userId,
        size,
        sizeFormatted: formatBytes(size),
      })),
      storagePerChat: Object.entries(storagePerChat).map(([chatId, size]) => ({
        chatId,
        size,
        sizeFormatted: formatBytes(size),
      })),
      uploadsPerDay: Object.entries(uploadsPerDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
      topUsers: topUsers.map((u) => ({
        userId: u._id,
        totalStorage: u.totalStorage,
        totalStorageFormatted: formatBytes(u.totalStorage),
        totalUploads: u.totalUploads,
      })),
      fileTypeDistribution: fileTypeDistribution.map((f) => ({
        type: f._id || 'other',
        count: f.count,
        totalSize: f.totalSize,
        totalSizeFormatted: formatBytes(f.totalSize),
      })),
    });
  } catch (error) {
    console.error('Error fetching file analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch file analytics' }, { status: 500 });
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

