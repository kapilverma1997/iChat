import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

import mongoose from 'mongoose';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Group from '../models/Group.js';
import ToDo from '../models/ToDo.js';
import Note from '../models/Note.js';
import Document from '../models/Document.js';
import Whiteboard from '../models/Whiteboard.js';
import Meeting from '../models/Meeting.js';
import PinnedMessage from '../models/PinnedMessage.js';
import Message from '../models/Message.js';
import CustomEmoji from '../models/CustomEmoji.js';
import Branding from '../models/Branding.js';
import UserPreferences from '../models/UserPreferences.js';
import LanguagePreferences from '../models/LanguagePreferences.js';
import connectDB from '../lib/mongodb.js';


async function seedCollaboration() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Get users
    const users = await User.find().limit(5);
    if (users.length < 2) {
      console.log('Need at least 2 users. Please seed users first.');
      return;
    }

    const [user1, user2] = users;

    // Get or create a chat
    let chat = await Chat.findOne({ participants: { $all: [user1._id, user2._id] } });
    if (!chat) {
      chat = new Chat({
        participants: [user1._id, user2._id],
        lastMessage: null,
      });
      await chat.save();
    }

    // Get or create a group
    let group = await Group.findOne({ 'members.userId': user1._id });
    if (!group) {
      group = new Group({
        name: 'Test Collaboration Group',
        description: 'Group for testing collaboration features',
        createdBy: user1._id,
        members: [
          {
            userId: user1._id,
            role: 'owner',
            joinedAt: new Date(),
          },
          {
            userId: user2._id,
            role: 'member',
            joinedAt: new Date(),
          },
        ],
      });
      await group.save();
    }

    console.log('Seeding collaboration data...');

    // Create Todos
    const todos = await ToDo.insertMany([
      {
        title: 'Complete project documentation',
        description: 'Write comprehensive documentation for all features',
        chatId: chat._id,
        createdBy: user1._id,
        assignedTo: user2._id,
        status: 'pending',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        tags: ['documentation', 'important'],
      },
      {
        title: 'Review code changes',
        description: 'Review all recent code changes',
        groupId: group._id,
        createdBy: user1._id,
        status: 'in-progress',
        priority: 'medium',
        tags: ['review'],
      },
      {
        title: 'Test collaboration features',
        description: 'Test all new collaboration features',
        chatId: chat._id,
        createdBy: user2._id,
        status: 'completed',
        priority: 'low',
        completedAt: new Date(),
        completedBy: user2._id,
      },
    ]);
    console.log(`Created ${todos.length} todos`);

    // Create Notes
    const notes = await Note.insertMany([
      {
        title: 'Meeting Notes - December 2024',
        content: '# Meeting Notes\n\n## Agenda\n1. Collaboration features\n2. Localization\n3. Testing',
        chatId: chat._id,
        createdBy: user1._id,
        isPinned: true,
        pinnedAt: new Date(),
        pinnedBy: user1._id,
        tags: ['meeting', 'notes'],
        versionHistory: [
          {
            version: 1,
            content: '# Meeting Notes\n\n## Agenda\n1. Collaboration features',
            editedBy: user1._id,
            changeSummary: 'Initial version',
          },
        ],
      },
      {
        title: 'Project Ideas',
        content: 'List of ideas for future improvements',
        groupId: group._id,
        createdBy: user2._id,
        tags: ['ideas'],
      },
    ]);
    console.log(`Created ${notes.length} notes`);

    // Create Documents
    const documents = await Document.insertMany([
      {
        title: 'Project Requirements',
        content: 'Detailed requirements for the collaboration features',
        chatId: chat._id,
        createdBy: user1._id,
        format: 'markdown',
        collaborators: [
          { user: user1._id, role: 'owner' },
          { user: user2._id, role: 'editor' },
        ],
      },
    ]);
    console.log(`Created ${documents.length} documents`);

    // Create Whiteboards
    const whiteboards = await Whiteboard.insertMany([
      {
        title: 'Brainstorming Session',
        chatId: chat._id,
        createdBy: user1._id,
        canvasData: JSON.stringify({ shapes: [], drawings: [] }),
        settings: {
          backgroundColor: '#ffffff',
          gridEnabled: true,
          snapToGrid: false,
        },
      },
    ]);
    console.log(`Created ${whiteboards.length} whiteboards`);

    // Create Meetings
    const meetings = await Meeting.insertMany([
      {
        title: 'Team Standup',
        description: 'Daily standup meeting',
        groupId: group._id,
        createdBy: user1._id,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 minutes
        duration: 30,
        participants: [
          { user: user1._id, status: 'accepted' },
          { user: user2._id, status: 'pending' },
        ],
        reminders: [
          { minutesBefore: 15, sent: false },
        ],
      },
    ]);
    console.log(`Created ${meetings.length} meetings`);

    // Create Pinned Messages
    const messages = await Message.find({ chatId: chat._id }).limit(3);
    if (messages.length > 0) {
      const pinnedMessages = await PinnedMessage.insertMany([
        {
          messageId: messages[0]._id,
          chatId: chat._id,
          pinnedBy: user1._id,
          order: 0,
          note: 'Important announcement',
        },
      ]);
      console.log(`Created ${pinnedMessages.length} pinned messages`);
    }

    // Create Custom Emojis
    const customEmojis = await CustomEmoji.insertMany([
      {
        name: 'party',
        imageUrl: '/emojis/party.png',
        uploadedBy: user1._id,
        isGlobal: true,
        category: 'custom',
        tags: ['celebration'],
      },
      {
        name: 'thumbs-up-custom',
        imageUrl: '/emojis/thumbs-up.png',
        uploadedBy: user2._id,
        groupId: group._id,
        category: 'custom',
        tags: ['approval'],
      },
    ]);
    console.log(`Created ${customEmojis.length} custom emojis`);

    // Create Branding
    const branding = await Branding.findOneAndUpdate(
      { organizationId: 'default' },
      {
        organizationId: 'default',
        logo: {
          navbar: '/logos/navbar.png',
          sidebar: '/logos/sidebar.png',
          login: '/logos/login.png',
          favicon: '/logos/favicon.ico',
        },
        colors: {
          primary: '#007bff',
          secondary: '#6c757d',
          accent: '#28a745',
        },
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('Created branding settings');

    // Create User Preferences
    const userPrefs = await UserPreferences.insertMany([
      {
        user: user1._id,
        theme: 'dark',
        statusDuration: 60,
        chatBackgrounds: [
          {
            chatId: chat._id,
            backgroundUrl: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundType: 'predefined',
          },
        ],
      },
      {
        user: user2._id,
        theme: 'light',
        statusDuration: 480,
      },
    ]);
    console.log(`Created ${userPrefs.length} user preferences`);

    // Create Language Preferences
    const langPrefs = await LanguagePreferences.insertMany([
      {
        user: user1._id,
        language: 'en',
        autoDetect: true,
        rtlEnabled: false,
      },
      {
        user: user2._id,
        language: 'es',
        autoDetect: false,
        rtlEnabled: false,
      },
    ]);
    console.log(`Created ${langPrefs.length} language preferences`);

    console.log('✅ Collaboration seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding collaboration data:', error);
    process.exit(1);
  }
}

seedCollaboration();

