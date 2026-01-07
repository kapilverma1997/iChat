import { getRabbitMQChannel, EXCHANGES, ROUTING_KEYS } from './rabbitmq.js';

/**
 * Publish a new message to RabbitMQ
 * This is called from the API route when a user sends a message
 */
export async function publishMessage(messageData) {
  const channel = await getRabbitMQChannel();

  const message = {
    messageId: messageData._id?.toString() || messageData.messageId,
    chatId: messageData.chatId?.toString() || messageData.chatId,
    senderId: messageData.senderId?.toString() || messageData.senderId,
    content: messageData.content,
    type: messageData.type,
    fileUrl: messageData.fileUrl,
    fileName: messageData.fileName,
    fileSize: messageData.fileSize,
    replyTo: messageData.replyTo?.toString() || messageData.replyTo,
    quotedMessage: messageData.quotedMessage?.toString() || messageData.quotedMessage,
    priority: messageData.priority,
    tags: messageData.tags,
    metadata: messageData.metadata,
    participants: messageData.participants || [],
    timestamp: new Date().toISOString(),
  };

  try {
    const published = channel.publish(
      EXCHANGES.MESSAGES,
      ROUTING_KEYS.MESSAGE_NEW,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true, // Persist message to disk
        messageId: message.messageId,
        timestamp: Date.now(),
        contentType: 'application/json',
        // Headers for message ordering
        headers: {
          'x-chat-id': message.chatId,
          'x-sender-id': message.senderId,
        },
      }
    );

    if (!published) {
      // Channel buffer is full, wait a bit and retry
      await new Promise((resolve) => setTimeout(resolve, 100));
      return await publishMessage(messageData);
    }

    console.log(`📤 Published message ${message.messageId} to RabbitMQ`);
    return true;
  } catch (error) {
    console.error('Error publishing message to RabbitMQ:', error);
    throw error;
  }
}

/**
 * Publish read receipt event
 */
export async function publishReadReceipt(receiptData) {
  const channel = await getRabbitMQChannel();

  const receipt = {
    messageId: receiptData.messageId?.toString() || receiptData.messageId,
    chatId: receiptData.chatId?.toString() || receiptData.chatId,
    userId: receiptData.userId?.toString() || receiptData.userId,
    readAt: receiptData.readAt || new Date().toISOString(),
    timestamp: new Date().toISOString(),
  };

  try {
    const published = channel.publish(
      EXCHANGES.READ_RECEIPTS,
      ROUTING_KEYS.MESSAGE_READ,
      Buffer.from(JSON.stringify(receipt)),
      {
        persistent: true,
        messageId: `read-${receipt.messageId}-${receipt.userId}`,
        timestamp: Date.now(),
        contentType: 'application/json',
      }
    );

    if (!published) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return await publishReadReceipt(receiptData);
    }

    console.log(`📤 Published read receipt for message ${receipt.messageId}`);
    return true;
  } catch (error) {
    console.error('Error publishing read receipt:', error);
    throw error;
  }
}

/**
 * Publish presence update (online/offline)
 */
export async function publishPresenceUpdate(presenceData) {
  const channel = await getRabbitMQChannel();

  const presence = {
    userId: presenceData.userId?.toString() || presenceData.userId,
    status: presenceData.status, // 'online' or 'offline'
    deviceId: presenceData.deviceId,
    timestamp: new Date().toISOString(),
  };

  try {
    const routingKey =
      presence.status === 'online'
        ? ROUTING_KEYS.USER_ONLINE
        : ROUTING_KEYS.USER_OFFLINE;

    const published = channel.publish(
      EXCHANGES.PRESENCE,
      routingKey,
      Buffer.from(JSON.stringify(presence)),
      {
        persistent: true,
        messageId: `presence-${presence.userId}-${Date.now()}`,
        timestamp: Date.now(),
        contentType: 'application/json',
      }
    );

    if (!published) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return await publishPresenceUpdate(presenceData);
    }

    console.log(`📤 Published presence update: ${presence.userId} is ${presence.status}`);
    return true;
  } catch (error) {
    console.error('Error publishing presence update:', error);
    throw error;
  }
}

