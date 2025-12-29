import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

import connectDB from '../lib/mongodb.js';
import Message from '../models/Message.js';
import GroupMessage from '../models/GroupMessage.js';
import MessageLog from '../models/MessageLog.js';

async function backfillMessageLogs() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Check existing logs count
    const existingLogsCount = await MessageLog.countDocuments();
    console.log(`Existing message logs: ${existingLogsCount}`);

    // Get all regular messages that don't have logs yet
    const messages = await Message.find({}).select('_id senderId chatId content type fileUrl fileName createdAt').lean();
    console.log(`Found ${messages.length} regular messages`);

    let regularLogsCreated = 0;
    let regularLogsSkipped = 0;

    for (const message of messages) {
      // Check if log already exists
      const existingLog = await MessageLog.findOne({ messageId: message._id });
      if (existingLog) {
        regularLogsSkipped++;
        continue;
      }

      try {
        await MessageLog.create({
          messageId: message._id,
          senderId: message.senderId,
          chatId: message.chatId,
          content: message.content || '',
          type: message.type || 'text',
          fileUrl: message.fileUrl || '',
          fileName: message.fileName || '',
        });
        regularLogsCreated++;
      } catch (error) {
        console.error(`Error creating log for message ${message._id}:`, error.message);
      }
    }

    console.log(`Regular messages: ${regularLogsCreated} created, ${regularLogsSkipped} skipped`);

    // Get all group messages that don't have logs yet
    const groupMessages = await GroupMessage.find({}).select('_id senderId groupId content type fileUrl fileName createdAt').lean();
    console.log(`Found ${groupMessages.length} group messages`);

    let groupLogsCreated = 0;
    let groupLogsSkipped = 0;

    for (const message of groupMessages) {
      // Check if log already exists
      const existingLog = await MessageLog.findOne({ messageId: message._id });
      if (existingLog) {
        groupLogsSkipped++;
        continue;
      }

      try {
        await MessageLog.create({
          messageId: message._id,
          senderId: message.senderId,
          groupId: message.groupId,
          content: message.content || '',
          type: message.type || 'text',
          fileUrl: message.fileUrl || '',
          fileName: message.fileName || '',
        });
        groupLogsCreated++;
      } catch (error) {
        console.error(`Error creating log for group message ${message._id}:`, error.message);
      }
    }

    console.log(`Group messages: ${groupLogsCreated} created, ${groupLogsSkipped} skipped`);

    const totalCreated = regularLogsCreated + groupLogsCreated;
    const totalSkipped = regularLogsSkipped + groupLogsSkipped;
    const finalCount = await MessageLog.countDocuments();

    console.log('\n=== Summary ===');
    console.log(`Total logs created: ${totalCreated}`);
    console.log(`Total logs skipped (already existed): ${totalSkipped}`);
    console.log(`Final message logs count: ${finalCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Error backfilling message logs:', error);
    process.exit(1);
  }
}

backfillMessageLogs();

