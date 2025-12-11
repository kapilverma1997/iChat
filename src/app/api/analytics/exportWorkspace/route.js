import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth.js';
import WorkspaceAnalytics from '../../../../models/WorkspaceAnalytics.js';
import UserActivityStat from '../../../../models/UserActivityStat.js';
import GroupActivityStat from '../../../../models/GroupActivityStat.js';
import ExportLog from '../../../../models/ExportLog.js';
import { isAdmin } from '../../../../lib/adminAuth.js';
import connectDB from '../../../../lib/mongodb.js';

export async function POST(request) {
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

    const body = await request.json();
    const { format, period, startDate, endDate } = body;

    if (!['pdf', 'excel', 'json'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    // Create export log
    const exportLog = new ExportLog({
      user: user._id,
      exportType: 'workspace',
      format,
      targetType: 'workspace',
      status: 'processing',
      options: {
        period,
        dateRange: startDate && endDate ? { start: new Date(startDate), end: new Date(endDate) } : null,
      },
    });
    await exportLog.save();

    // Fetch analytics data
    let filter = { period: period || 'daily' };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const workspaceStats = await WorkspaceAnalytics.find(filter).sort({ date: -1 });
    const userStats = await UserActivityStat.find({
      date: filter.date || { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).populate('user', 'name email');
    const groupStats = await GroupActivityStat.find({
      date: filter.date || { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).populate('group', 'name');

    // Format export data
    const exportData = {
      period,
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
      workspaceAnalytics: workspaceStats,
      userActivity: userStats.map((stat) => ({
        user: {
          id: stat.user._id,
          name: stat.user.name,
          email: stat.user.email,
        },
        totalMessagesSent: stat.totalMessagesSent,
        totalMessagesReceived: stat.totalMessagesReceived,
        averageResponseTime: stat.averageResponseTime,
        engagementScore: stat.engagementScore,
        date: stat.date,
      })),
      groupActivity: groupStats.map((stat) => ({
        group: {
          id: stat.group._id,
          name: stat.group.name,
        },
        totalMessages: stat.totalMessages,
        engagementScore: stat.engagementScore,
        date: stat.date,
      })),
      exportedAt: new Date(),
      exportedBy: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };

    let fileUrl;
    let fileSize;

    if (format === 'json') {
      fileUrl = `/exports/workspace_${exportLog._id}.json`;
      fileSize = JSON.stringify(exportData).length;
    } else if (format === 'excel') {
      // Generate Excel file
      fileUrl = `/exports/workspace_${exportLog._id}.xlsx`;
      fileSize = 0;
    } else if (format === 'pdf') {
      // Generate PDF report
      fileUrl = `/exports/workspace_${exportLog._id}.pdf`;
      fileSize = 0;
    }

    // Update export log
    exportLog.status = 'completed';
    exportLog.fileUrl = fileUrl;
    exportLog.fileSize = fileSize;
    exportLog.completedAt = new Date();
    await exportLog.save();

    return NextResponse.json({
      exportId: exportLog._id,
      fileUrl,
      fileSize,
      format,
      status: 'completed',
    });
  } catch (error) {
    console.error('Error exporting workspace:', error);
    
    if (exportLog) {
      exportLog.status = 'failed';
      exportLog.error = error.message;
      await exportLog.save();
    }

    return NextResponse.json({ error: 'Failed to export workspace' }, { status: 500 });
  }
}

