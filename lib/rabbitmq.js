import amqp from 'amqplib';

// Cache connection and channel
let cached = global.rabbitmq || { conn: null, channel: null, promise: null };

if (!global.rabbitmq) {
  global.rabbitmq = cached;
}

// RabbitMQ connection configuration
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const RABBITMQ_USERNAME = process.env.RABBITMQ_USERNAME || 'guest';
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || 'guest';

// Exchange and Queue names
export const EXCHANGES = {
  MESSAGES: 'chat.messages',
  READ_RECEIPTS: 'chat.read_receipts',
  PRESENCE: 'chat.presence',
};

export const QUEUES = {
  MESSAGE_DELIVERY: 'message.delivery',
  MESSAGE_STORAGE: 'message.storage',
  READ_RECEIPTS: 'read.receipts',
  PRESENCE_UPDATES: 'presence.updates',
  DEAD_LETTER: 'message.dlq', // Dead Letter Queue
};

export const ROUTING_KEYS = {
  MESSAGE_NEW: 'message.new',
  MESSAGE_DELIVERED: 'message.delivered',
  MESSAGE_READ: 'message.read',
  USER_ONLINE: 'user.online',
  USER_OFFLINE: 'user.offline',
};

/**
 * Connect to RabbitMQ and return connection
 */
async function connectRabbitMQ() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const connectionString = RABBITMQ_URL.includes('@')
      ? RABBITMQ_URL
      : `amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@${RABBITMQ_URL.replace('amqp://', '')}`;

    cached.promise = amqp
      .connect(connectionString)
      .then((conn) => {
        console.log('✅ Connected to RabbitMQ');
        
        // Handle connection errors
        conn.on('error', (err) => {
          console.error('RabbitMQ connection error:', err);
          cached.conn = null;
          cached.channel = null;
          cached.promise = null;
        });

        // Handle connection close
        conn.on('close', () => {
          console.log('RabbitMQ connection closed');
          cached.conn = null;
          cached.channel = null;
          cached.promise = null;
        });

        return conn;
      })
      .catch((err) => {
        cached.promise = null;
        
        // Provide cleaner error messages for common connection issues
        if (err.code === 'ECONNREFUSED') {
          const error = new Error('RabbitMQ connection refused. Is RabbitMQ running?');
          error.code = 'ECONNREFUSED';
          error.originalError = err;
          throw error;
        } else if (err.message && err.message.includes('Socket closed abruptly')) {
          const error = new Error('RabbitMQ connection closed during handshake. Check RabbitMQ is running and accessible.');
          error.code = 'EHANDSHAKE';
          error.originalError = err;
          throw error;
        }
        
        // For other errors, show a cleaner message
        const error = new Error(`Failed to connect to RabbitMQ: ${err.message || err}`);
        error.code = err.code || 'ECONNECTION';
        error.originalError = err;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Get or create a channel
 */
async function getChannel() {
  if (cached.channel) {
    return cached.channel;
  }

  const conn = await connectRabbitMQ();
  cached.channel = await conn.createChannel();

  // Set prefetch to process one message at a time for better ordering
  await cached.channel.prefetch(1);

  // Handle channel errors
  cached.channel.on('error', (err) => {
    console.error('RabbitMQ channel error:', err);
    cached.channel = null;
  });

  // Handle channel close
  cached.channel.on('close', () => {
    console.log('RabbitMQ channel closed');
    cached.channel = null;
  });

  return cached.channel;
}

/**
 * Initialize RabbitMQ: Create exchanges and queues
 */
export async function initRabbitMQ() {
  try {
    const channel = await getChannel();

    // Create exchanges (topic exchanges for routing flexibility)
    await channel.assertExchange(EXCHANGES.MESSAGES, 'topic', {
      durable: true, // Survive broker restarts
    });

    await channel.assertExchange(EXCHANGES.READ_RECEIPTS, 'topic', {
      durable: true,
    });

    await channel.assertExchange(EXCHANGES.PRESENCE, 'topic', {
      durable: true,
    });

    // Create queues
    // Message delivery queue - for delivering to online users via Socket.IO
    await channel.assertQueue(QUEUES.MESSAGE_DELIVERY, {
      durable: true,
      arguments: {
        'x-message-ttl': 3600000, // 1 hour TTL for undelivered messages
        'x-dead-letter-exchange': EXCHANGES.MESSAGES,
        'x-dead-letter-routing-key': ROUTING_KEYS.MESSAGE_NEW,
      },
    });

    // Message storage queue - for storing messages in MongoDB
    await channel.assertQueue(QUEUES.MESSAGE_STORAGE, {
      durable: true,
    });

    // Read receipts queue
    await channel.assertQueue(QUEUES.READ_RECEIPTS, {
      durable: true,
    });

    // Presence updates queue
    await channel.assertQueue(QUEUES.PRESENCE_UPDATES, {
      durable: true,
    });

    // Dead letter queue for failed messages
    await channel.assertQueue(QUEUES.DEAD_LETTER, {
      durable: true,
    });

    // Bind queues to exchanges
    // Message delivery: route new messages to delivery queue
    await channel.bindQueue(
      QUEUES.MESSAGE_DELIVERY,
      EXCHANGES.MESSAGES,
      ROUTING_KEYS.MESSAGE_NEW
    );

    // Message storage: also route new messages to storage queue
    await channel.bindQueue(
      QUEUES.MESSAGE_STORAGE,
      EXCHANGES.MESSAGES,
      ROUTING_KEYS.MESSAGE_NEW
    );

    // Read receipts
    await channel.bindQueue(
      QUEUES.READ_RECEIPTS,
      EXCHANGES.READ_RECEIPTS,
      ROUTING_KEYS.MESSAGE_READ
    );

    // Presence updates
    await channel.bindQueue(
      QUEUES.PRESENCE_UPDATES,
      EXCHANGES.PRESENCE,
      ROUTING_KEYS.USER_ONLINE
    );
    await channel.bindQueue(
      QUEUES.PRESENCE_UPDATES,
      EXCHANGES.PRESENCE,
      ROUTING_KEYS.USER_OFFLINE
    );

    console.log('✅ RabbitMQ exchanges and queues initialized');
    return channel;
  } catch (error) {
    // Only log the error message, not the full stack trace for connection issues
    if (error.code === 'ECONNREFUSED' || error.code === 'EHANDSHAKE') {
      console.error(`Failed to initialize RabbitMQ: ${error.message}`);
    } else {
      console.error('Failed to initialize RabbitMQ:', error.message || error);
    }
    throw error;
  }
}

/**
 * Get channel (for publishing/consuming)
 */
export async function getRabbitMQChannel() {
  return await getChannel();
}

/**
 * Close RabbitMQ connection
 */
export async function closeRabbitMQ() {
  if (cached.channel) {
    await cached.channel.close();
    cached.channel = null;
  }
  if (cached.conn) {
    await cached.conn.close();
    cached.conn = null;
  }
  cached.promise = null;
  console.log('RabbitMQ connection closed');
}

