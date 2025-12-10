import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Message from '../../../../../models/Message.js';
import Reminder from '../../../../../models/Reminder.js';
import Chat from '../../../../../models/Chat.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, remindAt } = await request.json();

    if (!messageId || !remindAt) {
      return NextResponse.json(
        { error: 'Message ID and remindAt are required' },
        { status: 400 }
      );
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Verify user has access to message
    const chat = await Chat.findOne({
      _id: message.chatId,
      participants: user._id,
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'You do not have access to this message' },
        { status: 403 }
      );
    }

    // Verify remindAt is in the future
    const remindDate = new Date(remindAt);
    if (remindDate <= new Date()) {
      return NextResponse.json(
        { error: 'Reminder time must be in the future' },
        { status: 400 }
      );
    }

    // Create or update reminder
    let reminder = await Reminder.findOne({ messageId, userId: user._id });
    if (reminder) {
      reminder.remindAt = remindDate;
      reminder.isCompleted = false;
      reminder.completedAt = null;
      await reminder.save();
    } else {
      reminder = await Reminder.create({
        messageId,
        userId: user._id,
        remindAt: remindDate,
      });
    }

    await reminder.populate('messageId');

    return NextResponse.json({
      success: true,
      reminder: reminder.toObject(),
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const completed = searchParams.get('completed');

    const query = { userId: user._id };
    if (completed !== null) {
      query.isCompleted = completed === 'true';
    }

    const reminders = await Reminder.find(query)
      .sort({ remindAt: 1 })
      .populate('messageId')
      .populate({
        path: 'messageId',
        populate: { path: 'chatId', select: 'participants' },
      });

    return NextResponse.json({
      success: true,
      reminders: reminders.map((r) => r.toObject()),
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reminderId, isCompleted } = await request.json();

    if (!reminderId || isCompleted === undefined) {
      return NextResponse.json(
        { error: 'Reminder ID and isCompleted are required' },
        { status: 400 }
      );
    }

    const reminder = await Reminder.findOne({
      _id: reminderId,
      userId: user._id,
    });

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    reminder.isCompleted = isCompleted;
    if (isCompleted) {
      reminder.completedAt = new Date();
    } else {
      reminder.completedAt = null;
    }
    await reminder.save();

    return NextResponse.json({
      success: true,
      reminder: reminder.toObject(),
    });
  } catch (error) {
    console.error('Update reminder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

