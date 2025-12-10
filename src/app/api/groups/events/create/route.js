import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import Group from '../../../../../../models/Group.js';
import GroupMessage from '../../../../../../models/GroupMessage.js';
import GroupEvent from '../../../../../../models/GroupEvent.js';
import { getMemberRole, hasPermission } from '../../../../../../lib/groupPermissions.js';
import { emitGroupEvent } from '../../../../../../lib/socket.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId, title, description, location, startDate, endDate, isAllDay, reminders } = await request.json();

    if (!groupId || !title || !startDate) {
      return NextResponse.json({ error: 'Group ID, title, and start date are required' }, { status: 400 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    if (!hasPermission(userRole, 'canCreateEvents')) {
      return NextResponse.json({ error: 'You do not have permission to create events' }, { status: 403 });
    }

    // Create event message
    const eventMessage = await GroupMessage.create({
      groupId,
      senderId: user._id,
      content: title,
      type: 'event',
    });

    // Create event
    const event = await GroupEvent.create({
      groupId,
      messageId: eventMessage._id,
      createdBy: user._id,
      title: title.trim(),
      description: description?.trim() || '',
      location: location?.trim() || '',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      isAllDay: isAllDay || false,
      reminders: reminders || [{ type: '15min', sent: false }],
    });

    // Add creator as going
    event.attendees.push({
      userId: user._id,
      status: 'going',
      respondedAt: new Date(),
    });
    await event.save();

    // Update group last message
    group.lastMessage = eventMessage._id;
    group.lastMessageAt = new Date();
    await group.save();

    await event.populate('createdBy', 'name email profilePhoto');
    await event.populate('attendees.userId', 'name email profilePhoto');
    await eventMessage.populate('senderId', 'name email profilePhoto');

    // Emit socket event
    emitGroupEvent(groupId, 'group:eventCreate', {
      event: event.toObject(),
      eventMessage: eventMessage.toObject(),
      groupId: groupId.toString(),
    });

    return NextResponse.json({
      message: 'Event created successfully',
      event,
      eventMessage,
    });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

