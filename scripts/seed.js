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
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { hashPassword } from '../lib/utils.js';

async function getSampleUsers() {
  return [
    {
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: await hashPassword('password123'),
      profilePhoto: '',
      presenceStatus: 'online',
      lastSeen: new Date(),
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      passwordHash: await hashPassword('password123'),
      profilePhoto: '',
      presenceStatus: 'away',
      lastSeen: new Date(Date.now() - 30 * 60000), // 30 minutes ago
    },
    {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      passwordHash: await hashPassword('password123'),
      profilePhoto: '',
      presenceStatus: 'offline',
      lastSeen: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    },
    {
      name: 'Alice Williams',
      email: 'alice@example.com',
      passwordHash: await hashPassword('password123'),
      profilePhoto: '',
      presenceStatus: 'online',
      lastSeen: new Date(),
    },
    {
      name: 'Kapil Verma',
      email: 'kapil@gmail.com',
      passwordHash: await hashPassword('password123'),
      profilePhoto: '',
      presenceStatus: 'online',
      lastSeen: new Date(),
    },
    {
      name: 'Rajan Verma',
      email: 'rajan@gmail.com',
      passwordHash: await hashPassword('password123'),
      profilePhoto: '',
      presenceStatus: 'away',
      lastSeen: new Date(Date.now() - 30 * 60000), // 30 minutes ago
    },
    {
      name: 'Shivram Kushwah',
      email: 'shivram@gmail.com',
      passwordHash: await hashPassword('password123'),
      profilePhoto: '',
      presenceStatus: 'offline',
      lastSeen: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    },
    {
      name: 'Pradeep Sir',
      email: 'pradeep@gmail.com',
      passwordHash: await hashPassword('password123'),
      profilePhoto: '',
      presenceStatus: 'online',
      lastSeen: new Date(),
    },
  ];
}

async function seed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data
    await Message.deleteMany({});
    await Chat.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const sampleUsers = await getSampleUsers();
    const users = await User.insertMany(sampleUsers);
    console.log(`Created ${users.length} users`);

    // Create chats and messages
    const chats = [];
    for (let i = 0; i < users.length - 1; i++) {
      const user1 = users[i];
      const user2 = users[i + 1];

      const chat = await Chat.create({
        participants: [user1._id, user2._id],
        messages: [],
        unreadCount: new Map([
          [user1._id.toString(), 0],
          [user2._id.toString(), 0],
        ]),
      });

      // Create sample messages
      const messages = [];
      const sampleMessages = [
        { content: 'Hello! How are you?', sender: user1 },
        { content: 'Hi! I am doing great, thanks!', sender: user2 },
        { content: 'That is awesome! Want to grab coffee?', sender: user1 },
        { content: 'Sure, sounds good!', sender: user2 },
      ];

      for (const msg of sampleMessages) {
        const message = await Message.create({
          chatId: chat._id,
          senderId: msg.sender._id,
          content: msg.content,
          type: 'text',
          deliveredAt: new Date(),
          readBy: [
            {
              userId: msg.sender._id.toString() === user1._id.toString() ? user2._id : user1._id,
              readAt: new Date(),
            },
          ],
        });
        messages.push(message);
        chat.messages.push(message._id);
      }

      chat.lastMessage = messages[messages.length - 1]._id;
      chat.lastMessageAt = messages[messages.length - 1].createdAt;
      await chat.save();

      chats.push(chat);
    }

    console.log(`Created ${chats.length} chats with messages`);
    console.log('\nSample users created:');
    users.forEach((user) => {
      console.log(`  - ${user.name} (${user.email}) - Password: password123`);
    });

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
