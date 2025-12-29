import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import ActiveUser from '../../../../../models/ActiveUser.js';

export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const isOnline = searchParams.get('isOnline');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build filter for ActiveUser model
    const matchFilter = {};

    if (isOnline !== null && isOnline !== undefined) {
      matchFilter.isOnline = isOnline === 'true';
    }

    // Use aggregation to filter out inactive users at database level
    const pipeline = [
      { $match: matchFilter },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      { $match: { 'user.isActive': { $ne: false } } },
      {
        $lookup: {
          from: 'chats',
          localField: 'currentChatId',
          foreignField: '_id',
          as: 'chat',
        },
      },
      { $unwind: { path: '$chat', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'groups',
          localField: 'currentGroupId',
          foreignField: '_id',
          as: 'group',
        },
      },
      { $unwind: { path: '$group', preserveNullAndEmptyArrays: true } },
      // Add search filter if search term is provided
      ...(search
        ? [
          {
            $match: {
              $or: [
                { 'user.name': { $regex: search, $options: 'i' } },
                { 'user.email': { $regex: search, $options: 'i' } },
                { deviceName: { $regex: search, $options: 'i' } },
                { browser: { $regex: search, $options: 'i' } },
                { os: { $regex: search, $options: 'i' } },
                { 'location.city': { $regex: search, $options: 'i' } },
                { 'location.country': { $regex: search, $options: 'i' } },
                { 'location.region': { $regex: search, $options: 'i' } },
              ],
            },
          },
        ]
        : []),
      { $sort: { lastActivityAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          userId: {
            _id: '$user._id',
            name: '$user.name',
            email: '$user.email',
            profilePhoto: '$user.profilePhoto',
          },
          deviceName: { $ifNull: ['$deviceName', 'Unknown'] },
          deviceType: { $ifNull: ['$deviceType', 'unknown'] },
          browser: { $ifNull: ['$browser', 'Unknown'] },
          os: { $ifNull: ['$os', 'Unknown'] },
          location: {
            city: { $ifNull: ['$location.city', ''] },
            country: { $ifNull: ['$location.country', ''] },
            region: { $ifNull: ['$location.region', ''] },
          },
          currentChatId: { $ifNull: ['$currentChatId', null] },
          currentGroupId: { $ifNull: ['$currentGroupId', null] },
          isOnline: { $ifNull: ['$isOnline', false] },
          lastActivityAt: {
            $ifNull: ['$lastActivityAt', '$createdAt'],
          },
          lastSeen: {
            $ifNull: [
              '$lastSeen',
              { $ifNull: ['$lastActivityAt', '$createdAt'] },
            ],
          },
          ipAddress: { $ifNull: ['$ipAddress', null] },
        },
      },
    ];

    const activeUsers = await ActiveUser.aggregate(pipeline);

    // Get counts using aggregation for better performance
    const totalFilter = {};
    if (isOnline !== null && isOnline !== undefined) {
      totalFilter.isOnline = isOnline === 'true';
    }

    // Count total active sessions (excluding inactive users) using aggregation
    const countPipeline = [
      { $match: totalFilter },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      { $match: { 'user.isActive': { $ne: false } } },
      // Add search filter if search term is provided
      ...(search
        ? [
          {
            $match: {
              $or: [
                { 'user.name': { $regex: search, $options: 'i' } },
                { 'user.email': { $regex: search, $options: 'i' } },
                { deviceName: { $regex: search, $options: 'i' } },
                { browser: { $regex: search, $options: 'i' } },
                { os: { $regex: search, $options: 'i' } },
                { 'location.city': { $regex: search, $options: 'i' } },
                { 'location.country': { $regex: search, $options: 'i' } },
                { 'location.region': { $regex: search, $options: 'i' } },
              ],
            },
          },
        ]
        : []),
    ];

    const [totalResult, onlineResult] = await Promise.all([
      ActiveUser.aggregate([...countPipeline, { $count: 'total' }]),
      ActiveUser.aggregate([
        ...countPipeline,
        { $match: { isOnline: true } },
        { $count: 'total' },
      ]),
    ]);

    const total = totalResult[0]?.total || 0;
    const onlineCount = onlineResult[0]?.total || 0;

    return NextResponse.json({
      activeUsers,
      page,
      limit,
      total,
      onlineCount,
      hasMore: total > page * limit,
    });
  } catch (error) {
    console.error('Get active users error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch active users' },
      { status: 500 }
    );
  }
}

