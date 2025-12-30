import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// / Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

import connectDB from '../lib/mongodb.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import FileModel from '../models/File.js';
import Reminder from '../models/Reminder.js';
import ScheduledMessage from '../models/ScheduledMessage.js';
import Group from '../models/Group.js';

async function seedAdvancedFeatures() {
  try {
    await connectDB();
    console.log('🌱 Seeding advanced messaging features...');

    // Get existing users
    const users = await User.find().limit(5);
    if (users.length < 2) {
      console.log('⚠️  Need at least 2 users. Please run seed.js first.');
      process.exit(1);
    }

    const [user1, user2, user3] = users;

    // Get or create a chat between user1 and user2
    let chat = await Chat.findOne({
      participants: { $all: [user1._id, user2._id] },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [user1._id, user2._id],
        messages: [],
        unreadCount: new Map(),
      });
    }

    // Create sample messages with various features
    const messages = [];

    // 1. Normal message
    const msg1 = await Message.create({
      chatId: chat._id,
      senderId: user1._id,
      content: 'Hello! This is a normal message.',
      type: 'text',
      priority: 'normal',
      deliveredAt: new Date(),
    });
    messages.push(msg1);

    // 2. Important message with tag
    const msg2 = await Message.create({
      chatId: chat._id,
      senderId: user1._id,
      content: 'This is an important message that needs attention!',
      type: 'text',
      priority: 'important',
      tags: ['important'],
      deliveredAt: new Date(),
    });
    messages.push(msg2);

    // 3. Urgent message
    const msg3 = await Message.create({
      chatId: chat._id,
      senderId: user2._id,
      content: 'URGENT: Please respond ASAP!',
      type: 'text',
      priority: 'urgent',
      tags: ['important', 'reminder'],
      deliveredAt: new Date(),
    });
    messages.push(msg3);

    // 4. Message with quote
    const msg4 = await Message.create({
      chatId: chat._id,
      senderId: user1._id,
      content: 'I agree with what you said earlier.',
      type: 'text',
      quotedMessage: msg2._id,
      priority: 'normal',
      deliveredAt: new Date(),
    });
    messages.push(msg4);

    // 5. Edited message
    const msg5 = await Message.create({
      chatId: chat._id,
      senderId: user2._id,
      content: 'This message was edited.',
      type: 'text',
      edited: true,
      editedAt: new Date(),
      priority: 'normal',
      deliveredAt: new Date(Date.now() - 60000),
    });
    messages.push(msg5);

    // 6. Message with To-Do tag
    const msg6 = await Message.create({
      chatId: chat._id,
      senderId: user1._id,
      content: 'Remember to complete the project by Friday.',
      type: 'text',
      tags: ['todo', 'reminder'],
      priority: 'important',
      deliveredAt: new Date(),
    });
    messages.push(msg6);

    // 7. Forwarded message
    const msg7 = await Message.create({
      chatId: chat._id,
      senderId: user2._id,
      content: 'Check this out!',
      type: 'text',
      forwardedFrom: {
        messageId: msg1._id,
        chatId: chat._id,
      },
      priority: 'normal',
      deliveredAt: new Date(),
    });
    messages.push(msg7);

    // 8. Message with expiration (expires in 1 day)
    const msg8 = await Message.create({
      chatId: chat._id,
      senderId: user1._id,
      content: 'This message will expire in 1 day.',
      type: 'text',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      priority: 'normal',
      deliveredAt: new Date(),
    });
    messages.push(msg8);

    // 9. Markdown formatted message
    const msg9 = await Message.create({
      chatId: chat._id,
      senderId: user2._id,
      content: '**Bold text** and *italic text* with `code` formatting.',
      type: 'markdown',
      priority: 'normal',
      deliveredAt: new Date(),
    });
    messages.push(msg9);

    // 10. Code block message
    const msg10 = await Message.create({
      chatId: chat._id,
      senderId: user1._id,
      content: 'function hello() {\n  console.log("Hello World");\n}',
      type: 'code',
      metadata: { language: 'javascript' },
      priority: 'normal',
      deliveredAt: new Date(),
    });
    messages.push(msg10);

    // Create sample files
    const file1 = await FileModel.create({
      url: '/uploads/sample-image.jpg',
      thumbnail: '/uploads/thumb-sample-image.jpg',
      metadata: {
        size: 1024000,
        type: 'image',
        name: 'sample-image.jpg',
        mimeType: 'image/jpeg',
        width: 1920,
        height: 1080,
      },
      uploadedBy: user1._id,
      chatId: chat._id,
    });

    const file2 = await FileModel.create({
      url: '/uploads/sample-document.pdf',
      metadata: {
        size: 512000,
        type: 'document',
        name: 'sample-document.pdf',
        mimeType: 'application/pdf',
      },
      uploadedBy: user2._id,
      chatId: chat._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
    });

    // Create message with file attachment
    const msg11 = await Message.create({
      chatId: chat._id,
      senderId: user1._id,
      content: 'Check out this image!',
      type: 'image',
      fileUrl: file1.url,
      fileName: file1.metadata.name,
      fileSize: file1.metadata.size,
      attachments: [
        {
          fileId: file1._id,
          url: file1.url,
          thumbnail: file1.thumbnail,
          type: 'image',
          name: file1.metadata.name,
          size: file1.metadata.size,
        },
      ],
      priority: 'normal',
      deliveredAt: new Date(),
    });
    messages.push(msg11);

    // Create reminders
    const reminder1 = await Reminder.create({
      messageId: msg6._id,
      userId: user1._id,
      remindAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // Remind in 2 hours
    });

    const reminder2 = await Reminder.create({
      messageId: msg3._id,
      userId: user2._id,
      remindAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Remind tomorrow
    });

    // Create scheduled messages
    const scheduled1 = await ScheduledMessage.create({
      message: {
        content: 'This is a scheduled message that will be sent tomorrow.',
        type: 'text',
        priority: 'normal',
        tags: [],
      },
      sendAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Send tomorrow
      targetChat: chat._id,
      senderId: user1._id,
    });

    const scheduled2 = await ScheduledMessage.create({
      message: {
        content: 'Urgent scheduled message!',
        type: 'text',
        priority: 'urgent',
        tags: ['important'],
      },
      sendAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // Send in 2 hours
      targetChat: chat._id,
      senderId: user2._id,
    });

    // Update chat with messages
    chat.messages = messages.map((m) => m._id);
    chat.lastMessage = messages[messages.length - 1]._id;
    chat.lastMessageAt = new Date();
    await chat.save();

    // console.log('✅ Created advanced features:');
    // console.log(`   - ${messages.length} messages with various features`);
    // console.log(`   - ${file1 ? 1 : 0} image file`);
    // console.log(`   - ${file2 ? 1 : 0} document file`);
    // console.log(`   - ${reminder1 ? 1 : 0} reminder`);
    // console.log(`   - ${reminder2 ? 1 : 0} reminder`);
    // console.log(`   - ${scheduled1 ? 1 : 0} scheduled message`);
    // console.log(`   - ${scheduled2 ? 1 : 0} scheduled message`);

    console.log('\n✨ Advanced features seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding advanced features:', error);
    process.exit(1);
  }
}

seedAdvancedFeatures();

