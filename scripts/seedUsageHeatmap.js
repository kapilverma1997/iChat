import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

import mongoose from 'mongoose';
import User from '../models/User.js';
import ActiveUser from '../models/ActiveUser.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import connectDB from '../lib/mongodb.js';

async function seedUsageHeatmap() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Get users
    const users = await User.find({ isActive: { $ne: false } }).limit(20);
    if (users.length === 0) {
      console.log('No users found. Please seed users first.');
      return;
    }

    // Get chats for messages, or create some if none exist
    let chats = await Chat.find().limit(10);
    
    // If no chats exist, create some basic chats between users
    if (chats.length === 0 && users.length >= 2) {
      console.log('No chats found. Creating sample chats...');
      const newChats = [];
      for (let i = 0; i < Math.min(5, users.length - 1); i++) {
        const chat = new Chat({
          participants: [users[i]._id, users[i + 1]._id],
          lastMessageAt: new Date(),
        });
        await chat.save();
        newChats.push(chat);
      }
      chats = newChats;
      console.log(`Created ${newChats.length} sample chats`);
    }

    console.log(`Seeding usage heatmap data for ${users.length} users...`);

    // Clear existing ActiveUser records (optional - comment out if you want to keep existing data)
    const deletedActiveUsers = await ActiveUser.deleteMany({});
    console.log(`Cleared ${deletedActiveUsers.deletedCount} existing ActiveUser records`);

    const today = new Date();
    const daysToSeed = 90; // Seed data for last 90 days
    const activeUserRecords = [];
    const messageRecords = [];

    // Device types and browsers for variety
    const deviceTypes = ['desktop', 'mobile', 'tablet'];
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const osList = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];

    // Generate activity for each day
    for (let dayOffset = 0; dayOffset < daysToSeed; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);

      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // For each hour of the day
      for (let hour = 0; hour < 24; hour++) {
        // Determine activity level based on hour and day
        let activityMultiplier = 1;
        
        // Peak hours: 9 AM - 5 PM on weekdays
        if (!isWeekend && hour >= 9 && hour <= 17) {
          activityMultiplier = 3; // High activity during business hours
        } else if (!isWeekend && ((hour >= 8 && hour < 9) || (hour > 17 && hour <= 20))) {
          activityMultiplier = 2; // Medium activity during commute hours
        } else if (isWeekend && hour >= 10 && hour <= 18) {
          activityMultiplier = 1.5; // Moderate activity on weekends
        } else {
          activityMultiplier = 0.3; // Low activity during off-hours
        }

        // Generate random number of active users for this hour
        const activeUserCount = Math.floor(
          Math.random() * users.length * activityMultiplier * 0.4
        );

        // Create ActiveUser records for this hour
        for (let i = 0; i < activeUserCount; i++) {
          const user = users[Math.floor(Math.random() * users.length)];
          const activityTime = new Date(date);
          activityTime.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

          // Create multiple activity records per user (simulating multiple sessions)
          const sessionsPerUser = Math.floor(Math.random() * 3) + 1;
          for (let session = 0; session < sessionsPerUser; session++) {
            const sessionTime = new Date(activityTime);
            sessionTime.setMinutes(sessionTime.getMinutes() + session * 30);

            activeUserRecords.push({
              userId: user._id,
              deviceId: `device-${user._id}-${Math.random().toString(36).substr(2, 9)}`,
              deviceName: `${deviceTypes[Math.floor(Math.random() * deviceTypes.length)]} Device`,
              deviceType: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
              browser: browsers[Math.floor(Math.random() * browsers.length)],
              os: osList[Math.floor(Math.random() * osList.length)],
              ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
              location: {
                country: 'US',
                region: 'CA',
                city: 'San Francisco',
              },
              isOnline: Math.random() > 0.3, // 70% chance of being online
              lastActivityAt: sessionTime,
              lastSeen: sessionTime,
            });
          }
        }

        // Generate messages for this hour
        const messageCount = Math.floor(
          activeUserCount * activityMultiplier * (Math.random() * 5 + 2)
        );

        for (let i = 0; i < messageCount; i++) {
          const user = users[Math.floor(Math.random() * users.length)];
          const chat = chats.length > 0 
            ? chats[Math.floor(Math.random() * chats.length)]
            : null;
          
          if (!chat) continue;

          const messageTime = new Date(date);
          messageTime.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

          messageRecords.push({
            senderId: user._id,
            chatId: chat._id,
            content: `Sample message for heatmap data - ${messageTime.toISOString()}`,
            type: Math.random() > 0.8 ? 'image' : 'text',
            isDeleted: false,
            createdAt: messageTime,
            updatedAt: messageTime,
          });
        }
      }

      // Progress indicator
      if ((dayOffset + 1) % 10 === 0) {
        console.log(`Processed ${dayOffset + 1} days...`);
      }
    }

    // Insert ActiveUser records in batches
    console.log(`Inserting ${activeUserRecords.length} ActiveUser records...`);
    const batchSize = 1000;
    for (let i = 0; i < activeUserRecords.length; i += batchSize) {
      const batch = activeUserRecords.slice(i, i + batchSize);
      await ActiveUser.insertMany(batch, { ordered: false });
      console.log(`Inserted ${Math.min(i + batchSize, activeUserRecords.length)}/${activeUserRecords.length} ActiveUser records`);
    }

    // Insert Message records in batches
    console.log(`Inserting ${messageRecords.length} Message records...`);
    for (let i = 0; i < messageRecords.length; i += batchSize) {
      const batch = messageRecords.slice(i, i + batchSize);
      await Message.insertMany(batch, { ordered: false });
      console.log(`Inserted ${Math.min(i + batchSize, messageRecords.length)}/${messageRecords.length} Message records`);
    }

    console.log('✅ Usage Heatmap seeding completed!');
    console.log(`   - Created ${activeUserRecords.length} ActiveUser records`);
    console.log(`   - Created ${messageRecords.length} Message records`);
    console.log(`   - Data spans ${daysToSeed} days`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding usage heatmap:', error);
    process.exit(1);
  }
}

seedUsageHeatmap();

