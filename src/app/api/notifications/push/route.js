import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import User from '../../../../../models/User.js';
import webpush from 'web-push';

// Configure web push (should be in environment variables)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@ichat.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Save push subscription
export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Push subscription is required' },
        { status: 400 }
      );
    }

    const userWithSubscription = await User.findById(user._id);
    userWithSubscription.pushSubscription = subscription;
    await userWithSubscription.save();

    return NextResponse.json({
      message: 'Push subscription saved successfully',
    });
  } catch (error) {
    console.error('Save push subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

// Send push notification
export async function PUT(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, title, body, data, icon, badge } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'User ID, title, and body are required' },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(userId);
    if (!targetUser || !targetUser.pushSubscription || !targetUser.pushSubscription.endpoint) {
      return NextResponse.json(
        { error: 'User not found or has no valid push subscription' },
        { status: 404 }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icon-192x192.png',
      badge: badge || '/badge-72x72.png',
      data: data || {},
    });

    try {
      await webpush.sendNotification(targetUser.pushSubscription, payload);
      return NextResponse.json({
        message: 'Push notification sent successfully',
      });
    } catch (error) {
      // If subscription is invalid, remove it
      if (error.statusCode === 410 || error.statusCode === 404 || error.message?.includes('endpoint')) {
        targetUser.pushSubscription = undefined;
        await targetUser.save();
      }
      throw error;
    }
  } catch (error) {
    console.error('Send push notification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send push notification' },
      { status: 500 }
    );
  }
}

// Get VAPID public key
export async function GET(request) {
  return NextResponse.json({
    publicKey: VAPID_PUBLIC_KEY,
  });
}

