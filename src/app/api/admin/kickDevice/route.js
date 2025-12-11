import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { requireAdmin } from '../../../../../lib/adminAuth.js';
import { logAudit } from '../../../../../lib/auditLogger.js';
import Device from '../../../../../models/Device.js';
import SessionLogin from '../../../../../models/SessionLogin.js';
import { getIO } from '../../../../../lib/socket.js';

// Kick user from device
export async function POST(request) {
  try {
    await connectDB();

    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { deviceId, userId, kickAll } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (kickAll) {
      // Kick from all devices
      const devices = await Device.find({ userId, isBlocked: false });
      
      // Invalidate all sessions
      await SessionLogin.updateMany(
        { userId, isActive: true },
        { isActive: false, loggedOutAt: new Date() }
      );

      // Emit socket event
      const io = getIO();
      if (io) {
        io.to(`user:${userId}`).emit('user:kicked', {
          message: 'You have been logged out from all devices by admin',
        });
      }

      // Log audit
      await logAudit({
        action: 'kick_all_devices',
        category: 'user_update',
        adminUserId: auth.user._id,
        targetUserId: userId,
        targetResourceType: 'device',
        request,
      });

      return NextResponse.json({
        message: 'User kicked from all devices successfully',
        devicesKicked: devices.length,
      });
    } else {
      // Kick from specific device
      if (!deviceId) {
        return NextResponse.json(
          { error: 'Device ID is required' },
          { status: 400 }
        );
      }

      const device = await Device.findOne({ deviceId, userId });
      if (!device) {
        return NextResponse.json({ error: 'Device not found' }, { status: 404 });
      }

      // Invalidate sessions for this device
      await SessionLogin.updateMany(
        { userId, deviceId, isActive: true },
        { isActive: false, loggedOutAt: new Date() }
      );

      // Emit socket event
      const io = getIO();
      if (io) {
        io.to(`user:${userId}`).emit('device:kicked', {
          deviceId,
          message: 'You have been logged out from this device by admin',
        });
      }

      // Log audit
      await logAudit({
        action: 'kick_device',
        category: 'user_update',
        adminUserId: auth.user._id,
        targetUserId: userId,
        targetResourceType: 'device',
        details: { deviceId },
        request,
      });

      return NextResponse.json({
        message: 'User kicked from device successfully',
      });
    }
  } catch (error) {
    console.error('Kick device error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to kick device' },
      { status: 500 }
    );
  }
}

