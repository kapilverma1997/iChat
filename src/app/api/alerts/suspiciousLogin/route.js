import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import SessionLogin from '../../../../../models/SessionLogin.js';
import Notification from '../../../../../models/Notification.js';
import User from '../../../../../models/User.js';
import { sendEmail } from '../../../../../lib/email.js';
import { getIO } from '../../../../../lib/socket.js';

// Detect suspicious login
export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      ipAddress,
      userAgent,
      deviceId,
      deviceName,
      deviceType,
      browser,
      os,
      location,
    } = await request.json();

    if (!ipAddress || !userAgent) {
      return NextResponse.json(
        { error: 'IP address and user agent are required' },
        { status: 400 }
      );
    }

    // Get user's recent logins
    const recentLogins = await SessionLogin.find({
      userId: user._id,
      isActive: true,
    })
      .sort({ loginAt: -1 })
      .limit(10);

    const suspiciousReasons = [];
    let isSuspicious = false;

    // Check for new device
    const existingDevice = recentLogins.find(
      (login) => login.deviceId === deviceId
    );
    if (!existingDevice && deviceId) {
      suspiciousReasons.push('new_device');
      isSuspicious = true;
    }

    // Check for new IP
    const existingIP = recentLogins.find(
      (login) => login.ipAddress === ipAddress
    );
    if (!existingIP) {
      suspiciousReasons.push('new_ip');
      isSuspicious = true;
    }

    // Check for unusual time (login outside normal hours)
    const now = new Date();
    const hour = now.getHours();
    const normalHours = recentLogins
      .map((login) => new Date(login.loginAt).getHours())
      .filter((h) => h >= 6 && h <= 23);

    if (normalHours.length > 0) {
      const avgHour = normalHours.reduce((a, b) => a + b, 0) / normalHours.length;
      if (Math.abs(hour - avgHour) > 6) {
        suspiciousReasons.push('unusual_time');
        isSuspicious = true;
      }
    }

    // Check for unusual location
    if (location && location.country) {
      const recentLocations = recentLogins
        .filter((login) => login.location && login.location.country)
        .map((login) => login.location.country);

      if (recentLocations.length > 0) {
        const uniqueLocations = [...new Set(recentLocations)];
        if (!uniqueLocations.includes(location.country)) {
          suspiciousReasons.push('unusual_location');
          isSuspicious = true;
        }
      }
    }

    // Check if device is trusted
    const userWithDevices = await User.findById(user._id);
    const isTrusted = userWithDevices.trustedDevices?.some(
      (device) => device.deviceId === deviceId
    );

    // Create session login record
    const sessionLogin = await SessionLogin.create({
      userId: user._id,
      ipAddress,
      userAgent,
      deviceId,
      deviceName,
      deviceType,
      browser,
      os,
      location,
      isTrusted,
      isSuspicious: isSuspicious && !isTrusted,
      suspiciousReasons: isSuspicious && !isTrusted ? suspiciousReasons : [],
    });

    // If suspicious, send alerts
    if (isSuspicious && !isTrusted) {
      // Create in-app notification
      await Notification.create({
        userId: user._id,
        type: 'suspicious_login',
        category: 'admin_alerts',
        title: 'Suspicious Login Detected',
        body: `A login was detected from ${ipAddress}${location?.city ? ` in ${location.city}` : ''}. If this wasn't you, please secure your account.`,
        data: {
          sessionId: sessionLogin._id.toString(),
          ipAddress,
          location,
          reasons: suspiciousReasons,
        },
        priority: 'high',
      });

      // Send email alert only if email notifications are enabled
      const emailEnabled = user.notificationSettings?.emailNotifications ?? user.notificationPreferences?.emailEnabled ?? false;
      if (emailEnabled) {
        await sendEmail({
          to: user.email,
          subject: 'Suspicious Login Detected - iChat',
          html: `
            <h2>Suspicious Login Detected</h2>
            <p>Hello ${user.name},</p>
            <p>We detected a login to your iChat account that seems suspicious:</p>
            <ul>
              <li><strong>IP Address:</strong> ${ipAddress}</li>
              <li><strong>Device:</strong> ${deviceName || 'Unknown'}</li>
              <li><strong>Location:</strong> ${location?.city || 'Unknown'}, ${location?.country || 'Unknown'}</li>
              <li><strong>Reasons:</strong> ${suspiciousReasons.join(', ')}</li>
            </ul>
            <p>If this wasn't you, please secure your account immediately.</p>
            <p>If this was you, you can ignore this email.</p>
          `,
          text: `Suspicious login detected from ${ipAddress}. If this wasn't you, please secure your account.`,
        });
      }

      // Emit socket event
      const io = getIO();
      if (io) {
        io.to(`user:${user._id}`).emit('security:suspiciousLogin', {
          sessionId: sessionLogin._id.toString(),
          ipAddress,
          location,
          reasons: suspiciousReasons,
        });
      }
    }

    return NextResponse.json({
      isSuspicious,
      suspiciousReasons,
      sessionId: sessionLogin._id,
      isTrusted,
    });
  } catch (error) {
    console.error('Suspicious login detection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to detect suspicious login' },
      { status: 500 }
    );
  }
}

// Get suspicious login history
export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const suspiciousLogins = await SessionLogin.find({
      userId: user._id,
      isSuspicious: true,
    })
      .sort({ loginAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      suspiciousLogins,
    });
  } catch (error) {
    console.error('Get suspicious logins error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get suspicious logins' },
      { status: 500 }
    );
  }
}

