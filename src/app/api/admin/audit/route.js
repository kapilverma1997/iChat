import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import AuditLog from '../../../../../models/AuditLog.js';

export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const category = searchParams.get('category');
    const action = searchParams.get('action');
    const adminUserId = searchParams.get('adminUserId');
    const targetUserId = searchParams.get('targetUserId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (action) {
      filter.action = { $regex: action, $options: 'i' };
    }

    if (adminUserId) {
      filter.adminUserId = adminUserId;
    }

    if (targetUserId) {
      filter.targetUserId = targetUserId;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    const auditLogs = await AuditLog.find(filter)
      .populate('adminUserId', 'name email')
      .populate('targetUserId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await AuditLog.countDocuments(filter);

    // Get category counts
    const categoryCounts = await AuditLog.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return NextResponse.json({
      auditLogs,
      page,
      limit,
      total,
      categoryCounts,
      hasMore: total > page * limit,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

