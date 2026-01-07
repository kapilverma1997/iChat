# RabbitMQ Integration - Quick Start Guide

## 🚀 Quick Setup

### 1. Install RabbitMQ

**Docker (Recommended for Development):**
```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=password \
  rabbitmq:3-management
```

**Access Management UI:** http://localhost:15672 (admin/password)

### 2. Install Dependencies

```bash
npm install amqplib
```

### 3. Configure Environment

Add to `.env.local`:
```env
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_USERNAME=admin
RABBITMQ_PASSWORD=password
```

### 4. Run Services

**Terminal 1 - Main Server:**
```bash
npm run dev
```

**Terminal 2 - Consumer Service:**
```bash
npm run consumer:dev
```

## 📋 Architecture Summary

```
User sends message
    ↓
API Route (POST /api/messages/send)
    ↓
1. Create in MongoDB (immediate)
2. Publish to RabbitMQ
    ↓
RabbitMQ Exchange: chat.messages
    ↓
    ├─→ Queue: message.delivery → Consumer → Socket.IO → Online Users
    └─→ Queue: message.storage → Consumer → MongoDB (backup)
```

## 🔑 Key Files

- `lib/rabbitmq.js` - Connection & queue setup
- `lib/messageProducer.js` - Publish messages
- `lib/messageConsumer.js` - Process messages
- `services/rabbitmq-consumer.js` - Separate consumer service
- `src/app/api/messages/send/route.js` - Updated to use RabbitMQ
- `src/app/api/messages/read/route.js` - Read receipts

## ✅ What's Implemented

1. ✅ Message publishing to RabbitMQ
2. ✅ Message delivery to online users via Socket.IO
3. ✅ Message storage in MongoDB (idempotency)
4. ✅ Read receipts with RabbitMQ events
5. ✅ Online/offline state management
6. ✅ Retry logic (3 retries, then DLQ)
7. ✅ Message ordering per chat
8. ✅ Error handling & fallback

## 🎯 Production Deployment

**Using PM2:**
```bash
# Start main server
pm2 start server.js --name ichat-server

# Start consumer
pm2 start services/rabbitmq-consumer.js --name rabbitmq-consumer

# Monitor
pm2 logs
pm2 status
```

**Using Docker Compose:**
See `RABBITMQ_INTEGRATION.md` for full docker-compose example.

## 🔍 Monitoring

1. **RabbitMQ Management UI:** http://localhost:15672
   - View queues, exchanges, connections
   - Monitor message rates
   - Check dead letter queue

2. **PM2 Logs:**
   ```bash
   pm2 logs rabbitmq-consumer
   ```

3. **Check Queue Lengths:**
   ```bash
   rabbitmqctl list_queues
   ```

## 🐛 Troubleshooting

**Messages not delivering?**
1. Check RabbitMQ is running: `docker ps` or `rabbitmqctl status`
2. Check consumer is running: `pm2 list`
3. Check logs: `pm2 logs rabbitmq-consumer`

**Consumer not starting?**
1. Check MongoDB connection
2. Check RabbitMQ connection
3. Check environment variables

**Messages stuck in queue?**
1. Check consumer logs for errors
2. Check MongoDB connection
3. Check Socket.IO connection

## 📚 Full Documentation

See `RABBITMQ_INTEGRATION.md` for complete documentation.

