# RabbitMQ Integration Guide

This document explains how RabbitMQ is integrated into the iChat application to improve message reliability, scalability, and offline message handling.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Where RabbitMQ Fits](#where-rabbitmq-fits)
3. [Message Flow](#message-flow)
4. [Components](#components)
5. [Setup & Configuration](#setup--configuration)
6. [Running the Services](#running-the-services)
7. [Read Receipts](#read-receipts)
8. [Online/Offline States](#onlineoffline-states)
9. [Error Handling & Retry Logic](#error-handling--retry-logic)
10. [Best Practices](#best-practices)

## 🏗️ Architecture Overview

### Current Architecture (Before RabbitMQ)

```
Client → Next.js API Route → MongoDB → Socket.IO → Client
```

**Issues:**
- No message queuing for offline users
- Direct Socket.IO dependency (fails if Socket.IO is down)
- No retry mechanism
- Difficult to scale horizontally

### New Architecture (With RabbitMQ)

```
Client → Next.js API Route → RabbitMQ → [Consumers] → Socket.IO + MongoDB → Client
                                    ↓
                              [Message Queue]
                                    ↓
                            [Offline Message Storage]
```

**Benefits:**
- ✅ Decoupled message processing
- ✅ Reliable message delivery
- ✅ Offline message queuing
- ✅ Horizontal scalability
- ✅ Retry mechanism
- ✅ Message ordering

## 🎯 Where RabbitMQ Fits

RabbitMQ acts as a **message broker** between:

1. **API Routes (Producers)** - When users send messages
2. **Consumer Services** - Background workers that process messages
3. **Socket.IO** - For real-time delivery to online users
4. **MongoDB** - For persistent storage

### Key Integration Points

```
┌─────────────────┐
│  Next.js API    │  ← User sends message
│  (Producer)     │
└────────┬────────┘
         │ publish
         ↓
┌─────────────────┐
│   RabbitMQ      │  ← Message broker
│   (Exchanges &  │
│    Queues)      │
└────────┬────────┘
         │ consume
         ↓
    ┌────┴────┐
    │         │
    ↓         ↓
┌────────┐ ┌──────────┐
│Socket.IO│ │ MongoDB  │
│Delivery │ │ Storage  │
└────────┘ └──────────┘
```

## 🔄 Message Flow

### 1. Sending a Message

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant RabbitMQ
    participant Consumer
    participant Socket.IO
    participant MongoDB

    Client->>API: POST /api/messages/send
    API->>MongoDB: Create message (immediate response)
    API->>RabbitMQ: Publish message to exchange
    API->>Client: Return message (200 OK)
    
    RabbitMQ->>Consumer: Deliver message to queue
    Consumer->>Socket.IO: Emit to online users
    Consumer->>MongoDB: Store message (idempotency check)
```

**Step-by-step:**

1. **User sends message** via API route (`POST /api/messages/send`)
2. **Message created in MongoDB** immediately (for fast response)
3. **Message published to RabbitMQ** exchange `chat.messages` with routing key `message.new`
4. **API returns** message to client (non-blocking)
5. **Consumer picks up message** from queue `message.delivery`
6. **Consumer delivers** to online users via Socket.IO
7. **Consumer stores** message in MongoDB (as backup/idempotency)

### 2. Message Delivery to Online Users

```javascript
// Consumer checks if user is online
if (isUserOnline(participantId)) {
  // Deliver via Socket.IO
  io.to(`user:${participantId}`).emit('message:new', { message });
}
```

### 3. Offline Message Handling

- Messages are **always stored in MongoDB** (via storage consumer)
- When user comes online, they fetch messages from MongoDB
- RabbitMQ ensures messages are persisted even if Socket.IO fails

## 🧩 Components

### 1. RabbitMQ Connection (`lib/rabbitmq.js`)

- Manages connection to RabbitMQ
- Creates exchanges and queues
- Handles connection errors and reconnection

**Exchanges:**
- `chat.messages` - Topic exchange for messages
- `chat.read_receipts` - Topic exchange for read receipts
- `chat.presence` - Topic exchange for online/offline status

**Queues:**
- `message.delivery` - Deliver messages to online users
- `message.storage` - Store messages in MongoDB
- `read.receipts` - Process read receipts
- `presence.updates` - Handle presence changes
- `message.dlq` - Dead letter queue for failed messages

### 2. Message Producer (`lib/messageProducer.js`)

**Functions:**
- `publishMessage(messageData)` - Publish new message
- `publishReadReceipt(receiptData)` - Publish read receipt
- `publishPresenceUpdate(presenceData)` - Publish online/offline status

**Usage:**
```javascript
import { publishMessage } from './lib/messageProducer.js';

await publishMessage({
  messageId: message._id,
  chatId: chat._id,
  senderId: user._id,
  content: 'Hello!',
  participants: chat.participants,
  // ... other fields
});
```

### 3. Message Consumer (`lib/messageConsumer.js`)

**Consumers:**
- `startMessageDeliveryConsumer()` - Deliver to online users
- `startMessageStorageConsumer()` - Store in MongoDB
- `startReadReceiptConsumer()` - Process read receipts
- `startPresenceConsumer()` - Handle presence updates

**Online User Tracking:**
```javascript
// In-memory set (use Redis for distributed systems)
const onlineUsers = new Set();

export function isUserOnline(userId) {
  return onlineUsers.has(userId.toString());
}
```

### 4. Consumer Service (`services/rabbitmq-consumer.js`)

**Separate process** that runs all consumers. This should run as a separate service:

```bash
node services/rabbitmq-consumer.js
```

Or with PM2:
```bash
pm2 start services/rabbitmq-consumer.js --name rabbitmq-consumer
```

## ⚙️ Setup & Configuration

### 1. Install RabbitMQ

**macOS:**
```bash
brew install rabbitmq
brew services start rabbitmq
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install rabbitmq-server
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server
```

**Docker:**
```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=password \
  rabbitmq:3-management
```

### 2. Environment Variables

Add to `.env.local`:

```env
# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest

# Or for remote RabbitMQ:
# RABBITMQ_URL=amqp://user:pass@rabbitmq.example.com:5672
```

### 3. Install Dependencies

```bash
npm install amqplib
```

## 🚀 Running the Services

### Development

**Terminal 1 - Main Server:**
```bash
npm run dev
```

**Terminal 2 - RabbitMQ Consumer:**
```bash
npm run consumer:dev
```

### Production

**Option 1: PM2 (Recommended)**

```bash
# Start main server
pm2 start server.js --name ichat-server

# Start consumer
pm2 start services/rabbitmq-consumer.js --name rabbitmq-consumer

# Save PM2 configuration
pm2 save
pm2 startup
```

**Option 2: Docker Compose**

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - rabbitmq
  
  consumer:
    build: .
    command: node services/rabbitmq-consumer.js
    depends_on:
      - rabbitmq
  
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
```

## ✅ Read Receipts

### Implementation

Read receipts use RabbitMQ to ensure reliable delivery:

1. **User reads message** → `POST /api/messages/read`
2. **API updates MongoDB** immediately
3. **API publishes read receipt** to RabbitMQ
4. **Consumer processes** read receipt
5. **Consumer emits** `message:read` event via Socket.IO to sender

### API Endpoints

**Mark single message as read:**
```javascript
POST /api/messages/read
{
  "messageId": "...",
  "chatId": "..."
}
```

**Mark all messages in chat as read:**
```javascript
PATCH /api/messages/read
{
  "chatId": "..."
}
```

### Read Status Indicators

- **Single tick (✓)** - Message delivered (stored in MongoDB)
- **Double tick (✓✓)** - Message read (in `readBy` array)

## 👤 Online/Offline States

### How It Works

1. **User connects** → Socket.IO `authenticate` event
2. **Publish online status** to RabbitMQ
3. **Consumer updates** in-memory set and MongoDB
4. **Consumer emits** presence update via Socket.IO

### Tracking Online Users

```javascript
// In-memory (fast lookup)
const onlineUsers = new Set();

// Also stored in MongoDB (ActiveUser collection)
// For distributed systems, use Redis instead
```

### Socket.IO Events

**Client → Server:**
- `authenticate(token)` - User connects
- `disconnect` - User disconnects

**Server → Client:**
- `user:presence` - Presence update broadcast

## 🔄 Error Handling & Retry Logic

### Message Retry

```javascript
// In consumer
const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;

if (retryCount < 3) {
  // Requeue message
  channel.nack(msg, false, true);
} else {
  // Send to dead letter queue
  channel.nack(msg, false, false);
}
```

### Dead Letter Queue

Failed messages (after 3 retries) are sent to `message.dlq` for manual inspection.

### Fallback Mechanism

If RabbitMQ is unavailable, the API route falls back to direct Socket.IO delivery:

```javascript
try {
  await publishMessage(messageData);
} catch (rabbitmqError) {
  // Fallback to direct Socket.IO
  io.emit('message:new', messageData);
}
```

## 📊 Message Ordering

### Guaranteeing Order

1. **Single consumer per queue** - `prefetch(1)` ensures one message at a time
2. **Routing key** - Messages for same chat use same routing key
3. **Message headers** - Include `x-chat-id` for ordering

### Per-Chat Ordering

Messages for the same chat are processed in order because:
- Same routing key → Same queue
- Single consumer → Sequential processing
- MongoDB `createdAt` timestamp for final ordering

## 🎯 Best Practices

### 1. Idempotency

Always check if message exists before creating:

```javascript
const existingMessage = await Message.findById(messageData.messageId);
if (existingMessage) {
  // Skip, already processed
  return;
}
```

### 2. Message Persistence

All messages are marked as `persistent: true`:

```javascript
channel.publish(exchange, routingKey, buffer, {
  persistent: true, // Survive broker restarts
});
```

### 3. Acknowledgment

Always acknowledge messages after successful processing:

```javascript
try {
  // Process message
  await processMessage(data);
  channel.ack(msg); // Acknowledge success
} catch (error) {
  channel.nack(msg, false, true); // Requeue on error
}
```

### 4. Connection Management

- Reuse connections (cached in `lib/rabbitmq.js`)
- Handle connection errors gracefully
- Implement reconnection logic

### 5. Monitoring

Monitor:
- Queue lengths (RabbitMQ Management UI)
- Consumer lag
- Dead letter queue
- Failed message count

### 6. Scaling

**Horizontal Scaling:**
- Run multiple consumer instances
- Use `prefetch(1)` for fair distribution
- Consider Redis for shared online user state

**Vertical Scaling:**
- Increase `prefetch` count (but maintain ordering)
- Use multiple queues per chat type

## 🔍 Troubleshooting

### Messages Not Delivering

1. Check RabbitMQ is running: `rabbitmqctl status`
2. Check consumer is running: `pm2 list`
3. Check queue length in RabbitMQ Management UI
4. Check logs: `pm2 logs rabbitmq-consumer`

### Messages Stuck in Queue

1. Check consumer is processing: `pm2 logs`
2. Check for errors in consumer logs
3. Check MongoDB connection
4. Check Socket.IO connection

### Read Receipts Not Working

1. Verify read receipt consumer is running
2. Check `read.receipts` queue in RabbitMQ
3. Verify Socket.IO is emitting events
4. Check MongoDB `readBy` array is updating

## 📝 Summary

**What Runs Where:**

1. **Next.js API Routes** (Main Server)
   - Publish messages to RabbitMQ
   - Handle HTTP requests
   - Initialize RabbitMQ (exchanges/queues)

2. **RabbitMQ Consumer Service** (Separate Process)
   - Consume messages from queues
   - Deliver to online users via Socket.IO
   - Store messages in MongoDB
   - Process read receipts
   - Handle presence updates

3. **Socket.IO** (Main Server)
   - Real-time delivery to clients
   - User presence tracking
   - Read receipt notifications

**Key Benefits:**
- ✅ Reliable message delivery
- ✅ Offline message support
- ✅ Scalable architecture
- ✅ Retry mechanism
- ✅ Message ordering
- ✅ Decoupled services

This architecture is **production-ready** and suitable for a real-time chat application without enterprise overkill.

