import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth.js';
import Meeting from '../../../../../models/Meeting.js';
import { getIO } from '../../../../../lib/socket.js';
import connectDB from '../../../../../lib/mongodb.js';

export async function POST(request) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, chatId, groupId, startTime, duration, participants, location, meetingLink, reminders } = body;

    if (!title || !startTime || !duration) {
      return NextResponse.json({ error: 'Title, start time, and duration are required' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);

    const meeting = new Meeting({
      title,
      description: description || '',
      chatId: chatId || null,
      groupId: groupId || null,
      createdBy: user._id,
      startTime: start,
      endTime: end,
      duration,
      location: location || '',
      meetingLink: meetingLink || '',
      participants: participants?.map(p => ({
        user: p,
        status: 'pending',
      })) || [],
      reminders: reminders || [],
    });

    await meeting.save();

    // Emit socket event
    const io = getIO();
    if (io) {
      const room = chatId ? `chat:${chatId}` : `group:${groupId}`;
      io.to(room).emit('meeting:scheduled', {
        action: 'created',
        meeting: await Meeting.findById(meeting._id)
          .populate('createdBy', 'name email profilePhoto')
          .populate('participants.user', 'name email profilePhoto'),
      });

      // Notify participants
      meeting.participants.forEach(p => {
        io.to(`user:${p.user}`).emit('meeting:scheduled', {
          action: 'invited',
          meeting: meeting,
        });
      });
    }

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
  }
}

