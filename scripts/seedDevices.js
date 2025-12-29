import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

import connectDB from '../lib/mongodb.js';
import User from '../models/User.js';
import Device from '../models/Device.js';

// Sample device configurations
const deviceConfigs = [
  // Desktop devices
  {
    deviceName: 'MacBook Pro 16"',
    deviceType: 'desktop',
    browser: 'Chrome',
    browserVersion: '120.0.0.0',
    os: 'macOS',
    osVersion: '14.2.1',
    ipAddress: '192.168.1.101',
    location: {
      country: 'United States',
      region: 'California',
      city: 'San Francisco',
      coordinates: { lat: 37.7749, lng: -122.4194 },
    },
  },
  {
    deviceName: 'Windows PC',
    deviceType: 'desktop',
    browser: 'Edge',
    browserVersion: '120.0.0.0',
    os: 'Windows',
    osVersion: '11',
    ipAddress: '192.168.1.102',
    location: {
      country: 'United States',
      region: 'New York',
      city: 'New York',
      coordinates: { lat: 40.7128, lng: -74.0060 },
    },
  },
  {
    deviceName: 'Dell Laptop',
    deviceType: 'desktop',
    browser: 'Firefox',
    browserVersion: '121.0',
    os: 'Windows',
    osVersion: '10',
    ipAddress: '192.168.1.103',
    location: {
      country: 'India',
      region: 'Maharashtra',
      city: 'Mumbai',
      coordinates: { lat: 19.0760, lng: 72.8777 },
    },
  },
  {
    deviceName: 'HP Desktop',
    deviceType: 'desktop',
    browser: 'Chrome',
    browserVersion: '119.0.0.0',
    os: 'Windows',
    osVersion: '11',
    ipAddress: '192.168.1.104',
    location: {
      country: 'United Kingdom',
      region: 'England',
      city: 'London',
      coordinates: { lat: 51.5074, lng: -0.1278 },
    },
  },
  {
    deviceName: 'iMac 27"',
    deviceType: 'desktop',
    browser: 'Safari',
    browserVersion: '17.2',
    os: 'macOS',
    osVersion: '14.1',
    ipAddress: '192.168.1.105',
    location: {
      country: 'Canada',
      region: 'Ontario',
      city: 'Toronto',
      coordinates: { lat: 43.6532, lng: -79.3832 },
    },
  },
  // Mobile devices
  {
    deviceName: 'iPhone 15 Pro',
    deviceType: 'mobile',
    browser: 'Safari',
    browserVersion: '17.2',
    os: 'iOS',
    osVersion: '17.2',
    ipAddress: '192.168.1.201',
    location: {
      country: 'United States',
      region: 'Texas',
      city: 'Austin',
      coordinates: { lat: 30.2672, lng: -97.7431 },
    },
  },
  {
    deviceName: 'Samsung Galaxy S24',
    deviceType: 'mobile',
    browser: 'Chrome',
    browserVersion: '120.0.0.0',
    os: 'Android',
    osVersion: '14',
    ipAddress: '192.168.1.202',
    location: {
      country: 'India',
      region: 'Delhi',
      city: 'New Delhi',
      coordinates: { lat: 28.6139, lng: 77.2090 },
    },
  },
  {
    deviceName: 'Google Pixel 8',
    deviceType: 'mobile',
    browser: 'Chrome',
    browserVersion: '121.0.0.0',
    os: 'Android',
    osVersion: '14',
    ipAddress: '192.168.1.203',
    location: {
      country: 'Australia',
      region: 'New South Wales',
      city: 'Sydney',
      coordinates: { lat: -33.8688, lng: 151.2093 },
    },
  },
  {
    deviceName: 'OnePlus 12',
    deviceType: 'mobile',
    browser: 'Chrome',
    browserVersion: '120.0.0.0',
    os: 'Android',
    osVersion: '13',
    ipAddress: '192.168.1.204',
    location: {
      country: 'Germany',
      region: 'Berlin',
      city: 'Berlin',
      coordinates: { lat: 52.5200, lng: 13.4050 },
    },
  },
  // Tablet devices
  {
    deviceName: 'iPad Pro 12.9"',
    deviceType: 'tablet',
    browser: 'Safari',
    browserVersion: '17.2',
    os: 'iPadOS',
    osVersion: '17.2',
    ipAddress: '192.168.1.301',
    location: {
      country: 'United States',
      region: 'Washington',
      city: 'Seattle',
      coordinates: { lat: 47.6062, lng: -122.3321 },
    },
  },
  {
    deviceName: 'Samsung Galaxy Tab S9',
    deviceType: 'tablet',
    browser: 'Chrome',
    browserVersion: '120.0.0.0',
    os: 'Android',
    osVersion: '13',
    ipAddress: '192.168.1.302',
    location: {
      country: 'Japan',
      region: 'Tokyo',
      city: 'Tokyo',
      coordinates: { lat: 35.6762, lng: 139.6503 },
    },
  },
];

function getRandomPastDate(daysAgo) {
  const now = Date.now();
  const randomTime = now - Math.random() * daysAgo * 24 * 60 * 60 * 1000;
  return new Date(randomTime);
}

function generateDeviceId() {
  return `device_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
}

async function seedDevices() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find().limit(50);
    if (users.length === 0) {
      console.log('No users found. Please run seed.js first to create users.');
      process.exit(1);
    }

    console.log(`Found ${users.length} users`);

    // Clear existing devices
    await Device.deleteMany({});
    console.log('Cleared existing devices');

    const devices = [];
    const deviceStatuses = [
      { isTrusted: true, isBlocked: false, isRestricted: false },
      { isTrusted: false, isBlocked: false, isRestricted: false },
      { isTrusted: false, isBlocked: true, isRestricted: false },
      { isTrusted: false, isBlocked: false, isRestricted: true },
      { isTrusted: false, isBlocked: false, isRestricted: false },
    ];

    // Create devices for each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Each user gets 1-4 devices
      const deviceCount = Math.floor(Math.random() * 4) + 1;
      
      for (let j = 0; j < deviceCount; j++) {
        const configIndex = Math.floor(Math.random() * deviceConfigs.length);
        const config = deviceConfigs[configIndex];
        const status = deviceStatuses[Math.floor(Math.random() * deviceStatuses.length)];
        
        // Generate unique device ID
        const deviceId = generateDeviceId();
        
        // Random dates
        const firstSeenAt = getRandomPastDate(90); // First seen 0-90 days ago
        const lastUsedAt = getRandomPastDate(7); // Last used 0-7 days ago
        const loginCount = Math.floor(Math.random() * 100) + 1;
        
        // Slightly modify IP address for uniqueness
        const ipParts = config.ipAddress.split('.');
        const lastOctet = parseInt(ipParts[3]) + (i * 10) + j;
        const modifiedIP = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.${lastOctet}`;
        
        const device = {
          userId: user._id,
          deviceId: deviceId,
          deviceName: config.deviceName,
          deviceType: config.deviceType,
          browser: config.browser,
          browserVersion: config.browserVersion,
          os: config.os,
          osVersion: config.osVersion,
          ipAddress: modifiedIP,
          location: { ...config.location },
          isTrusted: status.isTrusted,
          isBlocked: status.isBlocked,
          isRestricted: status.isRestricted,
          lastUsedAt: lastUsedAt,
          firstSeenAt: firstSeenAt,
          loginCount: loginCount,
        };
        
        devices.push(device);
      }
    }

    // Insert devices in batches to avoid unique constraint issues
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < devices.length; i += batchSize) {
      const batch = devices.slice(i, i + batchSize);
      try {
        await Device.insertMany(batch, { ordered: false });
        inserted += batch.length;
        console.log(`Inserted ${inserted}/${devices.length} devices...`);
      } catch (error) {
        // Handle duplicate key errors (deviceId + userId unique constraint)
        if (error.code === 11000) {
          console.log(`Skipped ${batch.length} devices due to duplicates`);
        } else {
          throw error;
        }
      }
    }

    // Get statistics
    const totalDevices = await Device.countDocuments();
    const blockedDevices = await Device.countDocuments({ isBlocked: true });
    const trustedDevices = await Device.countDocuments({ isTrusted: true });
    const restrictedDevices = await Device.countDocuments({ isRestricted: true });
    
    const deviceTypeStats = await Device.aggregate([
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('\n=== Device Seeding Summary ===');
    console.log(`Total devices created: ${totalDevices}`);
    console.log(`Blocked devices: ${blockedDevices}`);
    console.log(`Trusted devices: ${trustedDevices}`);
    console.log(`Restricted devices: ${restrictedDevices}`);
    console.log('\nDevice type distribution:');
    deviceTypeStats.forEach((stat) => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedDevices();

