import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

import connectDB from '../lib/mongodb.js';
import User from '../models/User.js';

async function migrateNotificationFields() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Default notification settings
    const defaultNotificationSettings = {
      pushNotifications: true,
      desktopNotifications: true,
      emailNotifications: false,
      soundEnabled: true,
      notificationPreview: true,
      showNotificationBadge: true,
      groupNotifications: true,
      directMessageNotifications: true,
      mentionNotifications: true,
      reactionNotifications: false,
    };

    // Default quiet hours
    const defaultQuietHours = {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    };

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);

    let updatedCount = 0;

    for (const user of users) {
      const updateData = {};
      let needsUpdate = false;

      console.log(user.email);
      console.log(user.notificationSettings);

      // Check and set notificationSettings
      if (!user.notificationSettings) {
        updateData.notificationSettings = defaultNotificationSettings;
        needsUpdate = true;
      } else {
        // Merge missing fields
        const mergedSettings = { ...defaultNotificationSettings };
        Object.keys(defaultNotificationSettings).forEach((key) => {
          if (user.notificationSettings[key] !== undefined) {
            mergedSettings[key] = user.notificationSettings[key];
          }
        });

        // Check if any fields are missing
        const hasAllFields = Object.keys(defaultNotificationSettings).every(
          (key) => user.notificationSettings[key] !== undefined
        );

        if (!hasAllFields) {
          updateData.notificationSettings = mergedSettings;
          needsUpdate = true;
        }
      }

      // Check and set quietHours
      if (!user.quietHours) {
        updateData.quietHours = defaultQuietHours;
        needsUpdate = true;
      } else {
        // Merge missing fields
        const mergedQuietHours = { ...defaultQuietHours };
        Object.keys(defaultQuietHours).forEach((key) => {
          if (user.quietHours[key] !== undefined) {
            mergedQuietHours[key] = user.quietHours[key];
          }
        });

        // Check if any fields are missing
        const hasAllFields = Object.keys(defaultQuietHours).every(
          (key) => user.quietHours[key] !== undefined
        );

        if (!hasAllFields) {
          updateData.quietHours = mergedQuietHours;
          needsUpdate = true;
        }
      }

      // Check and set notificationSound
      if (!user.notificationSound) {
        updateData.notificationSound = 'default';
        needsUpdate = true;
      }

      // Update user if needed
      if (needsUpdate) {
        await User.findByIdAndUpdate(user._id, { $set: updateData });
        updatedCount++;
        console.log(`Updated user: ${user.email || user.name}`);
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`Total users: ${users.length}`);
    console.log(`Users updated: ${updatedCount}`);
    console.log(`Users already up to date: ${users.length - updatedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateNotificationFields();

