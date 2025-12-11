import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import User from '../../../../../models/User.js';
import Chat from '../../../../../models/Chat.js';
import Group from '../../../../../models/Group.js';
import Message from '../../../../../models/Message.js';
import ActiveUser from '../../../../../models/ActiveUser.js';
import StorageAnalytics from '../../../../../models/StorageAnalytics.js';
import BroadcastChannel from '../../../../../models/BroadcastChannel.js';
import SessionLogin from '../../../../../models/SessionLogin.js';

export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await User.countDocuments();
    
    // Active users (online in last 5 minutes)
    const activeUsers = await ActiveUser.countDocuments({
      isOnline: true,
      lastActivityAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    });

    // Storage usage
    const storageStats = await StorageAnalytics.aggregate([
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$fileSize' },
          totalFiles: { $sum: '$fileCount' },
        },
      },
    ]);

    const totalStorage = storageStats[0]?.totalSize || 0;
    const totalFiles = storageStats[0]?.totalFiles || 0;

    // Messages sent today
    const messagesToday = await Message.countDocuments({
      createdAt: { $gte: todayStart },
      isDeleted: false,
    });

    // Groups created
    const totalGroups = await Group.countDocuments();
    const groupsToday = await Group.countDocuments({
      createdAt: { $gte: todayStart },
    });

    // Broadcast channels
    const broadcastChannels = await BroadcastChannel.countDocuments({
      isActive: true,
    });

    // Login activity (last 7 days)
    const loginActivity = await SessionLogin.aggregate([
      {
        $match: {
          loginAt: { $gte: last7Days },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$loginAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Active hours heatmap (last 30 days)
    const activeHours = await ActiveUser.aggregate([
      {
        $match: {
          lastActivityAt: { $gte: last30Days },
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

    // Device usage stats
    const deviceStats = await ActiveUser.aggregate([
      {
        $match: {
          isOnline: true,
        },
      },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Recently deleted messages (last 7 days)
    const deletedMessages = await Message.countDocuments({
      isDeleted: true,
      deletedAt: { $gte: last7Days },
    });

    // Recent audit logs
    const recentAudits = await import('../../../../../models/AuditLog.js').then(
      (module) => module.default.find({}).sort({ createdAt: -1 }).limit(10).lean()
    );

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        totalStorage: totalStorage / (1024 * 1024), // Convert to MB
        totalFiles,
        messagesToday,
        totalGroups,
        groupsToday,
        broadcastChannels,
        deletedMessages,
      },
      loginActivity,
      activeHours,
      deviceStats,
      recentAudits,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

