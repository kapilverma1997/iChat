import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Group from '../../../../../models/Group.js';
import GroupMessage from '../../../../../models/GroupMessage.js';

export async function GET(request) {
  try {
    await connectDB();
    console.log("connectDB");
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'all', 'public', 'private', 'my-groups'

    let query = {};

    if (type === 'my-groups') {
      // Groups where user is a member
      query = { 'members.userId': user._id };
    } else if (type === 'public') {
      query = { groupType: 'public' };
    } else if (type === 'private') {
      query = { groupType: 'private', 'members.userId': user._id };
    } else {
      // Show public groups and groups user is member of
      query = {
        $or: [
          { groupType: 'public' },
          { 'members.userId': user._id },
        ],
      };
    }

    const groups = await Group.find(query)
      .populate('members.userId', 'name email profilePhoto presenceStatus chatSettings')
      .populate('createdBy', 'name email profilePhoto')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .limit(100);

    // Add member role for current user and filter presenceStatus
    const groupsWithRole = groups.map(group => {
      const member = group.members.find(m => m.userId._id.toString() === user._id.toString());
      const groupObj = group.toObject();
      
      // Filter presenceStatus for members if showOnlineStatus is false
      if (groupObj.members) {
        groupObj.members = groupObj.members.map((member) => {
          if (member.userId && member.userId.chatSettings) {
            const showOnlineStatus = member.userId.chatSettings.showOnlineStatus !== false;
            if (!showOnlineStatus) {
              return {
                ...member,
                userId: {
                  ...member.userId,
                  presenceStatus: undefined,
                },
              };
            }
          }
          return member;
        });
      }
      
      return {
        ...groupObj,
        userRole: member?.role || null,
        isMember: !!member,
        memberCount: group.members.length,
      };
    });

    return NextResponse.json({ groups: groupsWithRole });
  } catch (error) {
    console.error('List groups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

