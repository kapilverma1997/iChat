import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import Meeting from '../../../../../../../models/Meeting.js';
import { getIO } from '../../../../../../../lib/socket.js';
import connectDB from '../../../../../../../lib/mongodb.js';

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body; // 'accepted', 'declined', 'tentative'

    if (!status || !['accepted', 'declined', 'tentative'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const meeting = await Meeting.findById(params.id);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const participant = meeting.participants.find(
      (p) => p.user.toString() === user._id.toString()
    );
    if (!participant) {
      return NextResponse.json({ error: 'You are not a participant' }, { status: 403 });
    }

    participant.status = status;
    participant.respondedAt = new Date();
    await meeting.save();

    // Emit socket event
    const io = getIO();
    if (io) {
      const room = meeting.chatId ? `chat:${meeting.chatId}` : `group:${meeting.groupId}`;
      io.to(room).emit('meeting:scheduled', {
        action: 'rsvp_updated',
        meeting: await Meeting.findById(meeting._id)
          .populate('participants.user', 'name email profilePhoto'),
      });
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 });
  }
}

