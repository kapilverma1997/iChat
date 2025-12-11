import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import Device from '../../../../../models/Device.js';
import SessionLogin from '../../../../../models/SessionLogin.js';
import { logAudit } from '../../../../../lib/auditLogger.js';
import { getIO } from '../../../../../lib/socket.js';

// Get all devices
export async function GET(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filter = {};
    if (userId) {
      filter.userId = userId;
    }

    const devices = await Device.find(filter)
      .populate('userId', 'name email')
      .sort({ lastUsedAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Device.countDocuments(filter);

    // Device statistics
    const deviceStats = await Device.aggregate([
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 },
          blocked: {
            $sum: { $cond: ['$isBlocked', 1, 0] },
          },
        },
      },
    ]);

    return NextResponse.json({
      devices,
      page,
      limit,
      total,
      deviceStats,
      hasMore: total > page * limit,
    });
  } catch (error) {
    console.error('Get devices error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}

// Block or restrict device
export async function PATCH(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { deviceId, action, userId } = await request.json();

    if (!deviceId || !action) {
      return NextResponse.json(
        { error: 'Device ID and action are required' },
        { status: 400 }
      );
    }

    const device = await Device.findOne({ deviceId, userId });
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const oldValue = {
      isBlocked: device.isBlocked,
      isRestricted: device.isRestricted,
    };

    if (action === 'block') {
      device.isBlocked = true;
    } else if (action === 'unblock') {
      device.isBlocked = false;
    } else if (action === 'restrict') {
      device.isRestricted = true;
    } else if (action === 'unrestrict') {
      device.isRestricted = false;
    }

    await device.save();

    // Log audit
    await logAudit({
      action: `device_${action}`,
      category: 'user_update',
      adminUserId: auth.user._id,
      targetUserId: device.userId,
      targetResourceType: 'device',
      oldValue,
      newValue: {
        isBlocked: device.isBlocked,
        isRestricted: device.isRestricted,
      },
      request,
    });

    // Emit socket event to kick user if blocked
    if (action === 'block' && userId) {
      const io = getIO();
      if (io) {
        io.to(`user:${userId}`).emit('device:blocked', {
          deviceId,
          message: 'Your device has been blocked by admin',
        });
      }
    }

    return NextResponse.json({
      message: `Device ${action}ed successfully`,
      device,
    });
  } catch (error) {
    console.error('Update device error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update device' },
      { status: 500 }
    );
  }
}

