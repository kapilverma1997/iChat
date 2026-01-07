import { getRabbitMQChannel, QUEUES, EXCHANGES, ROUTING_KEYS } from './rabbitmq.js';
import { getIO } from './socket.js';
import connectDB from './mongodb.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';

// Track online users (in-memory for quick lookup)
// In production, consider using Redis for distributed systems
const onlineUsers = new Set();

/**
 * Check if user is online
 */
export function isUserOnline(userId) {
  return onlineUsers.has(userId.toString());
}

/**
 * Mark user as online
 */
export function setUserOnline(userId) {
  onlineUsers.add(userId.toString());
}

/**
 * Mark user as offline
 */
export function setUserOffline(userId) {
  onlineUsers.delete(userId.toString());
}

/**
 * Consumer: Deliver messages to online users via Socket.IO
 * This runs as a separate worker process
 */
export async function startMessageDeliveryConsumer() {
  try {
    await connectDB();
    const channel = await getRabbitMQChannel();

    console.log('🚀 Starting message delivery consumer...');

    await channel.consume(
      QUEUES.MESSAGE_DELIVERY,
      async (msg) => {
        if (!msg) return;

        try {
          const messageData = JSON.parse(msg.content.toString());
          console.log(`📨 Processing message delivery: ${messageData.messageId}`);

          const io = getIO();
          if (!io) {
            // Socket.IO is not available in the consumer process (it runs separately)
            // This is expected - messages are already delivered via Socket.IO in the API route
            // The consumer is mainly for offline queuing and backup delivery
            console.log('⚠️  Socket.IO not available in consumer process (expected for separate process)');
            console.log('ℹ️  Message was already delivered via Socket.IO in API route');
            // Acknowledge the message since it was already delivered
            channel.ack(msg);
            return;
          }

          // Get participants from message or fetch from chat
          let participants = messageData.participants || [];
          if (participants.length === 0 && messageData.chatId) {
            const chat = await Chat.findById(messageData.chatId).select('participants');
            if (chat) {
              participants = chat.participants.map((p) => p.toString());
            }
          }

          // Deliver to online users via Socket.IO
          let deliveredCount = 0;
          const deliveredTo = [];

          // Normalize participant IDs to strings
          const normalizedParticipants = participants.map((p) =>
            p.toString ? p.toString() : String(p)
          );
          const normalizedSenderId = messageData.senderId?.toString ?
            messageData.senderId.toString() : String(messageData.senderId);

          for (const participantId of normalizedParticipants) {
            // Skip sender
            if (participantId === normalizedSenderId) continue;

            // Check if user is online
            if (isUserOnline(participantId)) {
              // Emit to user-specific room
              io.to(`user:${participantId}`).emit('message:new', {
                message: messageData,
                chatId: messageData.chatId,
              });

              io.to(`user:${participantId}`).emit('receiveMessage', {
                message: messageData,
                chatId: messageData.chatId,
              });

              deliveredTo.push(participantId);
              deliveredCount++;
            }
          }

          // Emit to chat room for all participants (fallback and for users who joined chat room)
          io.to(`chat:${messageData.chatId}`).emit('message:new', {
            message: messageData,
            chatId: messageData.chatId,
          });

          io.to(`chat:${messageData.chatId}`).emit('receiveMessage', {
            message: messageData,
            chatId: messageData.chatId,
          });

          console.log(
            `✅ Delivered message ${messageData.messageId} to ${deliveredCount} online users`
          );

          // Acknowledge message
          channel.ack(msg);

          // If message was delivered to at least one user, publish delivered event
          if (deliveredCount > 0) {
            // Update deliveredAt timestamp in MongoDB (handled by storage consumer)
            // We could also publish a delivered event here if needed
          }
        } catch (error) {
          console.error('Error processing message delivery:', error);
          // Retry logic: nack with requeue (up to max retries)
          const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
          if (retryCount < 3) {
            msg.properties.headers = msg.properties.headers || {};
            msg.properties.headers['x-retry-count'] = retryCount;
            channel.nack(msg, false, true); // Requeue
          } else {
            // Max retries reached, send to dead letter queue
            console.error(`Max retries reached for message, sending to DLQ`);
            channel.nack(msg, false, false); // Don't requeue
          }
        }
      },
      {
        noAck: false, // Manual acknowledgment
      }
    );

    console.log('✅ Message delivery consumer started');
  } catch (error) {
    console.error('Error starting message delivery consumer:', error);
    throw error;
  }
}

/**
 * Consumer: Store messages in MongoDB
 * This ensures all messages are persisted, even if Socket.IO fails
 */
export async function startMessageStorageConsumer() {
  try {
    await connectDB();
    const channel = await getRabbitMQChannel();

    console.log('🚀 Starting message storage consumer...');

    await channel.consume(
      QUEUES.MESSAGE_STORAGE,
      async (msg) => {
        if (!msg) return;

        try {
          const messageData = JSON.parse(msg.content.toString());
          console.log(`💾 Storing message: ${messageData.messageId}`);

          // Check if message already exists (idempotency)
          // Note: Message is already created in the API route, this is a backup/idempotency check
          const existingMessage = await Message.findById(messageData.messageId);
          if (existingMessage) {
            console.log(`Message ${messageData.messageId} already exists in MongoDB, skipping storage`);
            channel.ack(msg);
            return;
          }

          // This should rarely happen, but if message doesn't exist, create it as backup
          // This ensures messages are stored even if API route fails after publishing to RabbitMQ
          const message = await Message.create({
            _id: messageData.messageId,
            chatId: messageData.chatId,
            senderId: messageData.senderId,
            content: messageData.content,
            type: messageData.type,
            fileUrl: messageData.fileUrl || '',
            fileName: messageData.fileName || '',
            fileSize: messageData.fileSize || 0,
            replyTo: messageData.replyTo || null,
            quotedMessage: messageData.quotedMessage || null,
            priority: messageData.priority || 'normal',
            tags: messageData.tags || [],
            metadata: messageData.metadata || {},
            deliveredAt: new Date(),
          });

          // Update chat (only if message was just created)
          const chat = await Chat.findById(messageData.chatId);
          if (chat) {
            // Check if message ID is already in chat.messages
            if (!chat.messages.includes(message._id)) {
              chat.messages.push(message._id);
            }
            chat.lastMessage = message._id;
            chat.lastMessageAt = new Date();

            // Increment unread count for other participants
            chat.participants.forEach((participantId) => {
              if (participantId.toString() !== messageData.senderId) {
                const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
                chat.unreadCount.set(participantId.toString(), currentCount + 1);
              }
            });

            await chat.save();
          }

          // Create message log (idempotency check)
          try {
            const MessageLog = (await import('../models/MessageLog.js')).default;
            const existingLog = await MessageLog.findOne({ messageId: message._id });
            if (!existingLog) {
              await MessageLog.create({
                messageId: message._id,
                senderId: messageData.senderId,
                chatId: messageData.chatId,
                content: messageData.content,
                type: messageData.type,
                fileUrl: messageData.fileUrl,
                fileName: messageData.fileName,
              });
            }
          } catch (logError) {
            console.error('Error creating message log:', logError);
            // Don't fail the request if logging fails
          }

          console.log(`✅ Stored message ${messageData.messageId} in MongoDB`);
          channel.ack(msg);
        } catch (error) {
          console.error('Error storing message:', error);
          // Retry logic
          const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
          if (retryCount < 3) {
            msg.properties.headers = msg.properties.headers || {};
            msg.properties.headers['x-retry-count'] = retryCount;
            channel.nack(msg, false, true); // Requeue
          } else {
            console.error(`Max retries reached for message storage, sending to DLQ`);
            channel.nack(msg, false, false);
          }
        }
      },
      {
        noAck: false,
      }
    );

    console.log('✅ Message storage consumer started');
  } catch (error) {
    console.error('Error starting message storage consumer:', error);
    throw error;
  }
}

/**
 * Consumer: Handle read receipts
 */
export async function startReadReceiptConsumer() {
  try {
    await connectDB();
    const channel = await getRabbitMQChannel();

    console.log('🚀 Starting read receipt consumer...');

    await channel.consume(
      QUEUES.READ_RECEIPTS,
      async (msg) => {
        if (!msg) return;

        try {
          const receiptData = JSON.parse(msg.content.toString());
          console.log(`📖 Processing read receipt: ${receiptData.messageId} by ${receiptData.userId}`);

          // Update message read status
          const message = await Message.findById(receiptData.messageId);
          if (!message) {
            console.warn(`Message ${receiptData.messageId} not found`);
            channel.ack(msg);
            return;
          }

          // Check if already read by this user
          const alreadyRead = message.readBy.some(
            (r) => r.userId.toString() === receiptData.userId
          );

          if (!alreadyRead) {
            message.readBy.push({
              userId: receiptData.userId,
              readAt: new Date(receiptData.readAt),
            });
            await message.save();
          }

          // Emit read receipt via Socket.IO to sender
          const io = getIO();
          if (io) {
            // Notify sender that message was read
            io.to(`user:${message.senderId}`).emit('message:read', {
              messageId: receiptData.messageId,
              chatId: receiptData.chatId,
              readBy: receiptData.userId,
              readAt: receiptData.readAt,
            });

            // Also emit to chat room
            io.to(`chat:${receiptData.chatId}`).emit('message:read', {
              messageId: receiptData.messageId,
              chatId: receiptData.chatId,
              readBy: receiptData.userId,
              readAt: receiptData.readAt,
            });
          }

          console.log(`✅ Processed read receipt for message ${receiptData.messageId}`);
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing read receipt:', error);
          const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
          if (retryCount < 3) {
            msg.properties.headers = msg.properties.headers || {};
            msg.properties.headers['x-retry-count'] = retryCount;
            channel.nack(msg, false, true);
          } else {
            channel.nack(msg, false, false);
          }
        }
      },
      {
        noAck: false,
      }
    );

    console.log('✅ Read receipt consumer started');
  } catch (error) {
    console.error('Error starting read receipt consumer:', error);
    throw error;
  }
}

/**
 * Consumer: Handle presence updates (online/offline)
 */
export async function startPresenceConsumer() {
  try {
    await connectDB();
    const channel = await getRabbitMQChannel();

    console.log('🚀 Starting presence consumer...');

    await channel.consume(
      QUEUES.PRESENCE_UPDATES,
      async (msg) => {
        if (!msg) return;

        try {
          const presenceData = JSON.parse(msg.content.toString());
          console.log(`👤 Processing presence update: ${presenceData.userId} is ${presenceData.status}`);

          // Update in-memory online users set
          if (presenceData.status === 'online') {
            setUserOnline(presenceData.userId);
          } else {
            setUserOffline(presenceData.userId);
          }

          // Update ActiveUser collection in MongoDB
          try {
            const ActiveUser = (await import('../models/ActiveUser.js')).default;
            await ActiveUser.findOneAndUpdate(
              { userId: presenceData.userId, deviceId: presenceData.deviceId },
              {
                userId: presenceData.userId,
                deviceId: presenceData.deviceId || 'unknown',
                isOnline: presenceData.status === 'online',
                lastSeen: new Date(),
                lastActivityAt: new Date(),
              },
              { upsert: true, new: true }
            );
          } catch (dbError) {
            console.error('Error updating ActiveUser:', dbError);
            // Continue even if DB update fails
          }

          // Emit presence update via Socket.IO
          const io = getIO();
          if (io) {
            io.emit('user:presence', {
              userId: presenceData.userId,
              status: presenceData.status,
              timestamp: presenceData.timestamp,
            });
          }

          channel.ack(msg);
        } catch (error) {
          console.error('Error processing presence update:', error);
          channel.nack(msg, false, false); // Don't requeue presence updates
        }
      },
      {
        noAck: false,
      }
    );

    console.log('✅ Presence consumer started');
  } catch (error) {
    console.error('Error starting presence consumer:', error);
    throw error;
  }
}

/**
 * Start all consumers
 */
export async function startAllConsumers() {
  try {
    await startMessageDeliveryConsumer();
    await startMessageStorageConsumer();
    await startReadReceiptConsumer();
    await startPresenceConsumer();
    console.log('✅ All RabbitMQ consumers started');
  } catch (error) {
    console.error('Error starting consumers:', error);
    throw error;
  }
}

