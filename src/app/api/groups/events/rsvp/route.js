import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import Group from '../../../../../../models/Group.js';
import GroupEvent from '../../../../../../models/GroupEvent.js';
import { getMemberRole } from '../../../../../../lib/groupPermissions.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, status } = await request.json();

    if (!eventId || !status) {
      return NextResponse.json({ error: 'Event ID and status are required' }, { status: 400 });
    }

    if (!['going', 'maybe', 'not-going'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const event = await GroupEvent.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const group = await Group.findById(event.groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // Find or create attendee
    const attendeeIndex = event.attendees.findIndex(
      a => a.userId.toString() === user._id.toString()
    );

    if (attendeeIndex >= 0) {
      event.attendees[attendeeIndex].status = status;
      event.attendees[attendeeIndex].respondedAt = new Date();
    } else {
      event.attendees.push({
        userId: user._id,
        status,
        respondedAt: new Date(),
      });
    }

    await event.save();

    await event.populate('attendees.userId', 'name email profilePhoto');
    await event.populate('createdBy', 'name email profilePhoto');

    return NextResponse.json({
      message: 'RSVP updated successfully',
      event,
    });
  } catch (error) {
    console.error('RSVP event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

