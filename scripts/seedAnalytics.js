import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

import mongoose from 'mongoose';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Group from '../models/Group.js';
import Message from '../models/Message.js';
import MessageStat from '../models/MessageStat.js';
import FileUsageStat from '../models/FileUsageStat.js';
import UserActivityStat from '../models/UserActivityStat.js';
import GroupActivityStat from '../models/GroupActivityStat.js';
import WorkspaceAnalytics from '../models/WorkspaceAnalytics.js';
import connectDB from '../lib/mongodb.js';

async function seedAnalytics() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const users = await User.find().limit(10);
    if (users.length < 2) {
      console.log('Need at least 2 users. Please seed users first.');
      return;
    }

    const [user1, user2] = users;

    // Get chats and groups
    const chats = await Chat.find().limit(5);
    const groups = await Group.find().limit(3);

    console.log('Seeding analytics data...');

    // Generate message stats for last 30 days
    const today = new Date();
    const stats = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      // Message stats
      for (const chat of chats) {
        const messageCount = Math.floor(Math.random() * 50) + 10;
        stats.push({
          userId: user1._id,
          chatId: chat._id,
          date,
          messageCount,
          textMessages: Math.floor(messageCount * 0.7),
          mediaMessages: Math.floor(messageCount * 0.2),
          fileMessages: Math.floor(messageCount * 0.1),
          reactionsCount: Math.floor(messageCount * 0.3),
          averageResponseTime: Math.random() * 300 + 60, // 60-360 seconds
        });
      }

      // User activity stats
      stats.push({
        user: user1._id,
        date,
        totalMessagesSent: Math.floor(Math.random() * 100) + 20,
        totalMessagesReceived: Math.floor(Math.random() * 100) + 20,
        averageResponseTime: Math.random() * 300 + 60,
        engagementScore: Math.random() * 40 + 60, // 60-100
        activeHours: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          messageCount: Math.floor(Math.random() * 10),
          loginCount: hour >= 9 && hour <= 17 ? 1 : 0,
        })),
      });

      // Group activity stats
      for (const group of groups) {
        stats.push({
          group: group._id,
          date,
          totalMessages: Math.floor(Math.random() * 200) + 50,
          mediaUploads: Math.floor(Math.random() * 20),
          fileUploads: Math.floor(Math.random() * 10),
          engagementScore: Math.random() * 30 + 70,
          peakHours: Array.from({ length: 24 }, (_, hour) => ({
            hour,
            messageCount: hour >= 9 && hour <= 17 ? Math.floor(Math.random() * 20) : Math.floor(Math.random() * 5),
          })),
        });
      }
    }

    // Insert message stats
    const messageStats = stats.filter((s) => s.chatId);
    if (messageStats.length > 0) {
      await MessageStat.insertMany(messageStats);
      console.log(`Created ${messageStats.length} message stats`);
    }

    // Insert user activity stats
    const userStats = stats.filter((s) => s.user);
    if (userStats.length > 0) {
      await UserActivityStat.insertMany(userStats);
      console.log(`Created ${userStats.length} user activity stats`);
    }

    // Insert group activity stats
    const groupStats = stats.filter((s) => s.group);
    if (groupStats.length > 0) {
      await GroupActivityStat.insertMany(groupStats);
      console.log(`Created ${groupStats.length} group activity stats`);
    }

    // Create workspace analytics
    const workspaceAnalytics = new WorkspaceAnalytics({
      date: today,
      period: 'daily',
      totalMessages: 5000,
      totalUsers: users.length,
      activeUsers: Math.floor(users.length * 0.8),
      totalGroups: groups.length,
      activeGroups: groups.length,
      totalStorage: 1024 * 1024 * 1024 * 10, // 10GB
      mediaVsText: {
        media: 1500,
        text: 3500,
      },
      peakUsageHours: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        messageCount: hour >= 9 && hour <= 17 ? Math.floor(Math.random() * 100) + 50 : Math.floor(Math.random() * 20),
        userCount: hour >= 9 && hour <= 17 ? Math.floor(users.length * 0.7) : Math.floor(users.length * 0.2),
      })),
    });

    await workspaceAnalytics.save();
    console.log('Created workspace analytics');

    console.log('✅ Analytics seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding analytics:', error);
    process.exit(1);
  }
}

seedAnalytics();

