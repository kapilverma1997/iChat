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
import AuditLog from '../models/AuditLog.js';
import { hashPassword } from '../lib/utils.js';

// Sample IP addresses
const sampleIPs = [
  '192.168.1.100',
  '10.0.0.50',
  '172.16.0.25',
  '203.0.113.45',
  '198.51.100.10',
];

// Sample user agents
const sampleUserAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

// Sample browsers
const sampleBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];

// Sample OS
const sampleOS = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];

// Sample locations
const sampleLocations = [
  { country: 'United States', region: 'California', city: 'San Francisco' },
  { country: 'United States', region: 'New York', city: 'New York' },
  { country: 'United Kingdom', region: 'England', city: 'London' },
  { country: 'India', region: 'Maharashtra', city: 'Mumbai' },
  { country: 'Canada', region: 'Ontario', city: 'Toronto' },
];

// Helper function to get random item from array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get random date in the past N days
function getRandomPastDate(daysAgo) {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

async function seedAuditLog() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Get or create admin users
    let adminUsers = await User.find({ role: { $in: ['admin', 'owner'] } }).limit(5);
    
    if (adminUsers.length === 0) {
      console.log('No admin users found. Creating admin users...');
      // Create admin users if none exist
      const adminUserData = [
        {
          name: 'Admin User',
          email: 'admin@example.com',
          passwordHash: await hashPassword('password123'),
          role: 'admin',
          emailVerified: true,
        },
        {
          name: 'System Owner',
          email: 'owner@example.com',
          passwordHash: await hashPassword('password123'),
          role: 'owner',
          emailVerified: true,
        },
      ];
      adminUsers = await User.insertMany(adminUserData);
      console.log(`Created ${adminUsers.length} admin users`);
    }

    // Get regular users for targetUserId
    const regularUsers = await User.find({ role: { $nin: ['admin', 'owner'] } }).limit(10);
    
    if (regularUsers.length === 0) {
      console.log('No regular users found. Please run seed.js first to create users.');
      return;
    }

    console.log(`Found ${adminUsers.length} admin users and ${regularUsers.length} regular users`);

    // Clear existing audit logs
    await AuditLog.deleteMany({});
    console.log('Cleared existing audit logs');

    const auditLogs = [];

    // Generate audit logs for different categories
    const categories = [
      'login',
      'logout',
      'role_change',
      'message_delete',
      'file_delete',
      'user_remove',
      'setting_update',
      'user_create',
      'user_update',
      'user_deactivate',
      'chat_archive',
      'announcement_create',
      'broadcast_send',
    ];

    // Create login logs (20 entries)
    for (let i = 0; i < 20; i++) {
      const adminUser = getRandomItem(adminUsers);
      const createdAt = getRandomPastDate(30);
      
      auditLogs.push({
        action: 'User logged in',
        category: 'login',
        adminUserId: adminUser._id,
        targetUserId: adminUser._id,
        targetResourceType: 'user',
        ipAddress: getRandomItem(sampleIPs),
        userAgent: getRandomItem(sampleUserAgents),
        browser: getRandomItem(sampleBrowsers),
        os: getRandomItem(sampleOS),
        location: getRandomItem(sampleLocations),
        details: {
          loginMethod: 'email',
          success: true,
        },
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Create logout logs (15 entries)
    for (let i = 0; i < 15; i++) {
      const adminUser = getRandomItem(adminUsers);
      const createdAt = getRandomPastDate(30);
      
      auditLogs.push({
        action: 'User logged out',
        category: 'logout',
        adminUserId: adminUser._id,
        targetUserId: adminUser._id,
        targetResourceType: 'user',
        ipAddress: getRandomItem(sampleIPs),
        userAgent: getRandomItem(sampleUserAgents),
        browser: getRandomItem(sampleBrowsers),
        os: getRandomItem(sampleOS),
        location: getRandomItem(sampleLocations),
        details: {
          sessionDuration: Math.floor(Math.random() * 3600) + 300, // 5 minutes to 1 hour
        },
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Create role change logs (10 entries)
    for (let i = 0; i < 10; i++) {
      const adminUser = getRandomItem(adminUsers);
      const targetUser = getRandomItem(regularUsers);
      const roles = ['employee', 'moderator', 'admin', 'guest', 'read-only'];
      const oldRole = getRandomItem(roles);
      const newRole = getRandomItem(roles.filter(r => r !== oldRole));
      const createdAt = getRandomPastDate(30);
      
      auditLogs.push({
        action: 'User role changed',
        category: 'role_change',
        adminUserId: adminUser._id,
        targetUserId: targetUser._id,
        targetResourceType: 'user',
        oldValue: { role: oldRole },
        newValue: { role: newRole },
        ipAddress: getRandomItem(sampleIPs),
        userAgent: getRandomItem(sampleUserAgents),
        browser: getRandomItem(sampleBrowsers),
        os: getRandomItem(sampleOS),
        location: getRandomItem(sampleLocations),
        details: {
          reason: 'Administrative action',
        },
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Create message delete logs (8 entries)
    for (let i = 0; i < 8; i++) {
      const adminUser = getRandomItem(adminUsers);
      const targetUser = getRandomItem(regularUsers);
      const createdAt = getRandomPastDate(30);
      
      auditLogs.push({
        action: 'Message deleted',
        category: 'message_delete',
        adminUserId: adminUser._id,
        targetUserId: targetUser._id,
        targetResourceType: 'message',
        targetResourceId: new mongoose.Types.ObjectId(),
        oldValue: {
          content: 'Sample message content that was deleted',
          messageId: new mongoose.Types.ObjectId().toString(),
        },
        ipAddress: getRandomItem(sampleIPs),
        userAgent: getRandomItem(sampleUserAgents),
        browser: getRandomItem(sampleBrowsers),
        os: getRandomItem(sampleOS),
        location: getRandomItem(sampleLocations),
        details: {
          reason: 'Inappropriate content',
        },
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Create file delete logs (5 entries)
    for (let i = 0; i < 5; i++) {
      const adminUser = getRandomItem(adminUsers);
      const targetUser = getRandomItem(regularUsers);
      const createdAt = getRandomPastDate(30);
      
      auditLogs.push({
        action: 'File deleted',
        category: 'file_delete',
        adminUserId: adminUser._id,
        targetUserId: targetUser._id,
        targetResourceType: 'file',
        targetResourceId: new mongoose.Types.ObjectId(),
        oldValue: {
          fileName: `document_${i + 1}.pdf`,
          fileSize: Math.floor(Math.random() * 10000000) + 1000000, // 1MB to 10MB
        },
        ipAddress: getRandomItem(sampleIPs),
        userAgent: getRandomItem(sampleUserAgents),
        browser: getRandomItem(sampleBrowsers),
        os: getRandomItem(sampleOS),
        location: getRandomItem(sampleLocations),
        details: {
          reason: 'Storage cleanup',
        },
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Create user remove logs (5 entries)
    for (let i = 0; i < 5; i++) {
      const adminUser = getRandomItem(adminUsers);
      const targetUser = getRandomItem(regularUsers);
      const createdAt = getRandomPastDate(30);
      
      auditLogs.push({
        action: 'User removed from group',
        category: 'user_remove',
        adminUserId: adminUser._id,
        targetUserId: targetUser._id,
        targetResourceType: 'user',
        targetResourceId: new mongoose.Types.ObjectId(),
        oldValue: {
          groupName: `Group ${i + 1}`,
          userRole: 'member',
        },
        ipAddress: getRandomItem(sampleIPs),
        userAgent: getRandomItem(sampleUserAgents),
        browser: getRandomItem(sampleBrowsers),
        os: getRandomItem(sampleOS),
        location: getRandomItem(sampleLocations),
        details: {
          reason: 'Violation of group rules',
        },
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Create setting update logs (10 entries)
    for (let i = 0; i < 10; i++) {
      const adminUser = getRandomItem(adminUsers);
      const createdAt = getRandomPastDate(30);
      const settings = [
        { key: 'maxFileSize', old: '10MB', new: '20MB' },
        { key: 'messageRetention', old: '30 days', new: '90 days' },
        { key: 'allowGroupCreation', old: true, new: false },
        { key: 'requireEmailVerification', old: false, new: true },
        { key: 'maxGroupMembers', old: 100, new: 200 },
      ];
      const setting = getRandomItem(settings);
      
      auditLogs.push({
        action: 'System settings updated',
        category: 'setting_update',
        adminUserId: adminUser._id,
        targetResourceType: 'settings',
        oldValue: { [setting.key]: setting.old },
        newValue: { [setting.key]: setting.new },
        ipAddress: getRandomItem(sampleIPs),
        userAgent: getRandomItem(sampleUserAgents),
        browser: getRandomItem(sampleBrowsers),
        os: getRandomItem(sampleOS),
        location: getRandomItem(sampleLocations),
        details: {
          settingKey: setting.key,
        },
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Create user create logs (8 entries)
    for (let i = 0; i < 8; i++) {
      const adminUser = getRandomItem(adminUsers);
      const targetUser = getRandomItem(regularUsers);
      const createdAt = getRandomPastDate(30);
      
      auditLogs.push({
        action: 'New user created',
        category: 'user_create',
        adminUserId: adminUser._id,
        targetUserId: targetUser._id,
        targetResourceType: 'user',
        newValue: {
          email: targetUser.email,
          name: targetUser.name,
          role: targetUser.role || 'employee',
        },
        ipAddress: getRandomItem(sampleIPs),
        userAgent: getRandomItem(sampleUserAgents),
        browser: getRandomItem(sampleBrowsers),
        os: getRandomItem(sampleOS),
        location: getRandomItem(sampleLocations),
        details: {
          createdBy: 'admin',
        },
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Create user update logs (10 entries)
    for (let i = 0; i < 10; i++) {
      const adminUser = getRandomItem(adminUsers);
      const targetUser = getRandomItem(regularUsers);
      const createdAt = getRandomPastDate(30);
      
      auditLogs.push({
        action: 'User profile updated',
        category: 'user_update',
        adminUserId: adminUser._id,
        targetUserId: targetUser._id,
        targetResourceType: 'user',
        oldValue: {
          name: targetUser.name,
          designation: 'Previous Designation',
        },
        newValue: {
          name: targetUser.name,
          designation: 'Updated Designation',
        },
        ipAddress: getRandomItem(sampleIPs),
        userAgent: getRandomItem(sampleUserAgents),
        browser: getRandomItem(sampleBrowsers),
        os: getRandomItem(sampleOS),
        location: getRandomItem(sampleLocations),
        details: {
          fieldsUpdated: ['designation'],
        },
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Create user deactivate logs (5 entries)
    for (let i = 0; i < 5; i++) {
      const adminUser = getRandomItem(adminUsers);
      const targetUser = getRandomItem(regularUsers);
      const createdAt = getRandomPastDate(30);
      
      auditLogs.push({
        action: 'User account deactivated',
        category: 'user_deactivate',
        adminUserId: adminUser._id,
        targetUserId: targetUser._id,
        targetResourceType: 'user',
        oldValue: {
          isActive: true,
        },
        newValue: {
          isActive: false,
        },
        ipAddress: getRandomItem(sampleIPs),
        userAgent: getRandomItem(sampleUserAgents),
        browser: getRandomItem(sampleBrowsers),
        os: getRandomItem(sampleOS),
        location: getRandomItem(sampleLocations),
        details: {
          reason: 'Account suspension',
        },
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Create chat archive logs (6 entries)
    for (let i = 0; i < 6; i++) {
      const adminUser = getRandomItem(adminUsers);
      const createdAt = getRandomPastDate(30);
      
      auditLogs.push({
        action: 'Chat archived',
        category: 'chat_archive',
        adminUserId: adminUser._id,
        targetResourceType: 'chat',
        targetResourceId: new mongoose.Types.ObjectId(),
        newValue: {
          archiveDate: createdAt,
          reason: 'Long inactive chat',
        },
        ipAddress: getRandomItem(sampleIPs),
        userAgent: getRandomItem(sampleUserAgents),
        browser: getRandomItem(sampleBrowsers),
        os: getRandomItem(sampleOS),
        location: getRandomItem(sampleLocations),
        details: {
          chatId: new mongoose.Types.ObjectId().toString(),
        },
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Create announcement create logs (7 entries)
    for (let i = 0; i < 7; i++) {
      const adminUser = getRandomItem(adminUsers);
      const createdAt = getRandomPastDate(30);
      
      auditLogs.push({
        action: 'Announcement created',
        category: 'announcement_create',
        adminUserId: adminUser._id,
        targetResourceType: 'announcement',
        targetResourceId: new mongoose.Types.ObjectId(),
        newValue: {
          title: `Announcement ${i + 1}`,
          type: 'general',
        },
        ipAddress: getRandomItem(sampleIPs),
        userAgent: getRandomItem(sampleUserAgents),
        browser: getRandomItem(sampleBrowsers),
        os: getRandomItem(sampleOS),
        location: getRandomItem(sampleLocations),
        details: {
          announcementId: new mongoose.Types.ObjectId().toString(),
        },
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Create broadcast send logs (5 entries)
    for (let i = 0; i < 5; i++) {
      const adminUser = getRandomItem(adminUsers);
      const createdAt = getRandomPastDate(30);
      
      auditLogs.push({
        action: 'Broadcast message sent',
        category: 'broadcast_send',
        adminUserId: adminUser._id,
        targetResourceType: 'broadcast',
        targetResourceId: new mongoose.Types.ObjectId(),
        newValue: {
          channelName: `Channel ${i + 1}`,
          recipientsCount: Math.floor(Math.random() * 1000) + 100,
        },
        ipAddress: getRandomItem(sampleIPs),
        userAgent: getRandomItem(sampleUserAgents),
        browser: getRandomItem(sampleBrowsers),
        os: getRandomItem(sampleOS),
        location: getRandomItem(sampleLocations),
        details: {
          broadcastId: new mongoose.Types.ObjectId().toString(),
        },
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Insert all audit logs
    const createdLogs = await AuditLog.insertMany(auditLogs);
    console.log(`\n✅ Successfully created ${createdLogs.length} audit log entries:`);
    
    // Count by category
    const categoryCounts = {};
    createdLogs.forEach(log => {
      categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;
    });
    
    console.log('\nBreakdown by category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   - ${category}: ${count}`);
    });

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedAuditLog();

