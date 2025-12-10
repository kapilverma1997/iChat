import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import GroupMessage from '../models/GroupMessage.js';
import GroupPoll from '../models/GroupPoll.js';
import GroupEvent from '../models/GroupEvent.js';

async function seedGroups() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find().limit(20);
    if (users.length < 5) {
      console.log('Not enough users. Please run seed.js first to create users.');
      return;
    }

    console.log(`Found ${users.length} users`);

    // Clear existing groups
    await Group.deleteMany({});
    await GroupMessage.deleteMany({});
    await GroupPoll.deleteMany({});
    await GroupEvent.deleteMany({});
    console.log('Cleared existing groups data');

    const groups = [];

    // Create 5 public groups
    const publicGroups = [
      {
        name: 'Tech Enthusiasts',
        description: 'Discuss the latest in technology and innovation',
        groupType: 'public',
        welcomeMessage: 'Welcome to Tech Enthusiasts! Share your tech insights.',
        createdBy: users[0]._id,
        members: [
          { userId: users[0]._id, role: 'owner' },
          { userId: users[1]._id, role: 'admin' },
          { userId: users[2]._id, role: 'member' },
          { userId: users[3]._id, role: 'member' },
          { userId: users[4]._id, role: 'member' },
        ],
      },
      {
        name: 'Design Community',
        description: 'Share design inspiration and feedback',
        groupType: 'public',
        welcomeMessage: 'Welcome designers! Let\'s create amazing things together.',
        createdBy: users[1]._id,
        members: [
          { userId: users[1]._id, role: 'owner' },
          { userId: users[0]._id, role: 'admin' },
          { userId: users[2]._id, role: 'moderator' },
          { userId: users[3]._id, role: 'member' },
        ],
      },
      {
        name: 'Startup Founders',
        description: 'Network with fellow entrepreneurs',
        groupType: 'public',
        welcomeMessage: 'Welcome founders! Share your journey and learn from others.',
        createdBy: users[2]._id,
        members: [
          { userId: users[2]._id, role: 'owner' },
          { userId: users[0]._id, role: 'admin' },
          { userId: users[1]._id, role: 'member' },
          { userId: users[4]._id, role: 'member' },
        ],
      },
      {
        name: 'Web Developers',
        description: 'Frontend and backend development discussions',
        groupType: 'public',
        welcomeMessage: 'Welcome developers! Code, share, and learn together.',
        createdBy: users[3]._id,
        members: [
          { userId: users[3]._id, role: 'owner' },
          { userId: users[1]._id, role: 'admin' },
          { userId: users[2]._id, role: 'member' },
          { userId: users[4]._id, role: 'member' },
        ],
      },
      {
        name: 'Open Source Contributors',
        description: 'Collaborate on open source projects',
        groupType: 'public',
        welcomeMessage: 'Welcome contributors! Let\'s build amazing open source projects.',
        createdBy: users[4]._id,
        members: [
          { userId: users[4]._id, role: 'owner' },
          { userId: users[0]._id, role: 'admin' },
          { userId: users[1]._id, role: 'moderator' },
          { userId: users[2]._id, role: 'member' },
          { userId: users[3]._id, role: 'member' },
        ],
      },
    ];

    // Create 3 private groups
    const privateGroups = [
      {
        name: 'VIP Members',
        description: 'Exclusive group for VIP members only',
        groupType: 'private',
        welcomeMessage: 'Welcome to the VIP group!',
        createdBy: users[0]._id,
        members: [
          { userId: users[0]._id, role: 'owner' },
          { userId: users[1]._id, role: 'admin' },
          { userId: users[2]._id, role: 'member' },
        ],
      },
      {
        name: 'Beta Testers',
        description: 'Private group for beta testing new features',
        groupType: 'private',
        welcomeMessage: 'Thanks for being a beta tester!',
        createdBy: users[1]._id,
        members: [
          { userId: users[1]._id, role: 'owner' },
          { userId: users[0]._id, role: 'admin' },
          { userId: users[3]._id, role: 'member' },
        ],
      },
      {
        name: 'Team Leads',
        description: 'Internal group for team leads',
        groupType: 'private',
        welcomeMessage: 'Welcome team leads!',
        createdBy: users[2]._id,
        members: [
          { userId: users[2]._id, role: 'owner' },
          { userId: users[0]._id, role: 'admin' },
          { userId: users[1]._id, role: 'admin' },
        ],
      },
    ];

    // Create 2 announcement groups
    const announcementGroups = [
      {
        name: 'Company Announcements',
        description: 'Official company announcements',
        groupType: 'announcement',
        welcomeMessage: 'Stay updated with company news',
        createdBy: users[0]._id,
        members: [
          { userId: users[0]._id, role: 'owner' },
          { userId: users[1]._id, role: 'admin' },
          { userId: users[2]._id, role: 'admin' },
          ...users.slice(3, 10).map(u => ({ userId: u._id, role: 'read-only' })),
        ],
      },
      {
        name: 'System Updates',
        description: 'System maintenance and update notifications',
        groupType: 'announcement',
        welcomeMessage: 'Get notified about system updates',
        createdBy: users[1]._id,
        members: [
          { userId: users[1]._id, role: 'owner' },
          { userId: users[0]._id, role: 'admin' },
          ...users.slice(2, 10).map(u => ({ userId: u._id, role: 'read-only' })),
        ],
      },
    ];

    // Create all groups
    for (const groupData of [...publicGroups, ...privateGroups, ...announcementGroups]) {
      const group = await Group.create(groupData);
      groups.push(group);
      console.log(`Created group: ${group.name}`);

      // Create some sample messages
      const messages = [];
      for (let i = 0; i < 5; i++) {
        const sender = group.members[Math.floor(Math.random() * group.members.length)];
        const message = await GroupMessage.create({
          groupId: group._id,
          senderId: sender.userId,
          content: `Sample message ${i + 1} in ${group.name}`,
          type: 'text',
        });
        messages.push(message);
      }

      // Update group last message
      if (messages.length > 0) {
        group.lastMessage = messages[messages.length - 1]._id;
        group.lastMessageAt = messages[messages.length - 1].createdAt;
        await group.save();
      }

      // Create a sample poll for some groups
      if (Math.random() > 0.5 && group.groupType !== 'announcement') {
        const pollMessage = await GroupMessage.create({
          groupId: group._id,
          senderId: group.members[0].userId,
          content: 'What is your favorite programming language?',
          type: 'poll',
        });

        await GroupPoll.create({
          groupId: group._id,
          messageId: pollMessage._id,
          createdBy: group.members[0].userId,
          question: 'What is your favorite programming language?',
          options: [
            { text: 'JavaScript', votes: [] },
            { text: 'Python', votes: [] },
            { text: 'Java', votes: [] },
            { text: 'TypeScript', votes: [] },
          ],
        });
      }

      // Create a sample event for some groups
      if (Math.random() > 0.5 && group.groupType !== 'announcement') {
        const eventMessage = await GroupMessage.create({
          groupId: group._id,
          senderId: group.members[0].userId,
          content: 'Team Meeting',
          type: 'event',
        });

        await GroupEvent.create({
          groupId: group._id,
          messageId: eventMessage._id,
          createdBy: group.members[0].userId,
          title: 'Team Meeting',
          description: 'Monthly team sync',
          location: 'Conference Room A',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          isAllDay: false,
        });
      }
    }

    console.log(`\n✅ Successfully created:`);
    console.log(`   - ${publicGroups.length} public groups`);
    console.log(`   - ${privateGroups.length} private groups`);
    console.log(`   - ${announcementGroups.length} announcement groups`);
    console.log(`   - Sample messages, polls, and events`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding groups:', error);
    process.exit(1);
  }
}

seedGroups();

