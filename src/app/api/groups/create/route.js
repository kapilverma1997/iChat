import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Group from '../../../../../models/Group.js';
import { emitGroupEvent } from '../../../../../lib/socket.js';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, groupType, groupPhoto, welcomeMessage, settings } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    if (!['public', 'private', 'announcement'].includes(groupType)) {
      return NextResponse.json({ error: 'Invalid group type' }, { status: 400 });
    }

    // Create group with creator as owner
    const group = await Group.create({
      name: name.trim(),
      description: description?.trim() || '',
      groupType,
      groupPhoto: groupPhoto || '',
      welcomeMessage: welcomeMessage?.trim() || '',
      createdBy: user._id,
      members: [
        {
          userId: user._id,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
      settings: {
        onlyAdminsSendFiles: settings?.onlyAdminsSendFiles || false,
        onlyAdminsCreatePolls: settings?.onlyAdminsCreatePolls || false,
        onlyAdminsChangeInfo: settings?.onlyAdminsChangeInfo || false,
        allowReactions: settings?.allowReactions !== undefined ? settings.allowReactions : true,
        allowReplies: settings?.allowReplies !== undefined ? settings.allowReplies : true,
        muted: false,
        readOnly: false,
      },
    });

    await group.populate('members.userId', 'name email profilePhoto');
    await group.populate('createdBy', 'name email profilePhoto');

    // Emit socket event
    emitGroupEvent(group._id.toString(), 'group:create', {
      group: group.toObject(),
    });

    return NextResponse.json({
      message: 'Group created successfully',
      group,
    });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

