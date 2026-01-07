import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../../lib/auth.js';
import Group from '../../../../../../models/Group.js';
import { getMemberRole, hasPermission } from '../../../../../../lib/groupPermissions.js';
import crypto from 'crypto';

// GET - Get or generate invite link
export async function GET(request, { params }) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // Only members with permission to add members can see/generate invite links
    if (!hasPermission(userRole, 'canAddMembers')) {
      return NextResponse.json({ error: 'You do not have permission to manage invite links' }, { status: 403 });
    }

    // Generate token if it doesn't exist
    if (!group.inviteToken) {
      group.inviteToken = crypto.randomBytes(32).toString('hex');
      await group.save();
    }

    // Get base URL from request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const baseUrl = `${protocol}://${host}`;
    const inviteLink = `${baseUrl}/groups/join?token=${group.inviteToken}`;

    return NextResponse.json({
      inviteLink,
      inviteToken: group.inviteToken,
    });
  } catch (error) {
    console.error('Get invite link error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Reset invite token
export async function POST(request, { params }) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const userRole = getMemberRole(group, user._id);
    if (!userRole) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // Only members with permission to add members can reset invite links
    if (!hasPermission(userRole, 'canAddMembers')) {
      return NextResponse.json({ error: 'You do not have permission to reset invite links' }, { status: 403 });
    }

    // Generate new token
    group.inviteToken = crypto.randomBytes(32).toString('hex');
    await group.save();

    // Get base URL from request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const baseUrl = `${protocol}://${host}`;
    const inviteLink = `${baseUrl}/groups/join?token=${group.inviteToken}`;

    return NextResponse.json({
      message: 'Invite link reset successfully',
      inviteLink,
      inviteToken: group.inviteToken,
    });
  } catch (error) {
    console.error('Reset invite link error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


