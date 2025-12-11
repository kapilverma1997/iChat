import { Server } from 'socket.io';

// Use global to store socket instance across module boundaries in Next.js
const globalForSocket = globalThis;

export function initSocket(server) {
  if (globalForSocket.io) {
    return globalForSocket.io;
  }

  globalForSocket.io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  });

  globalForSocket.io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Store user ID on socket (set by client on connection)
    let userId = null;

    // ========== Authentication ==========
    socket.on('authenticate', (token) => {
      // Verify token and set userId
      // This is a simplified version - you should verify JWT token properly
      try {
        const { verifyAccessToken } = require('./utils.js');
        const decoded = verifyAccessToken(token);
        if (decoded && decoded.userId) {
          userId = decoded.userId;
          socket.join(`user:${userId}`);
          console.log(`Socket ${socket.id} authenticated as user: ${userId}`);
        }
      } catch (error) {
        console.error('Socket authentication error:', error);
      }
    });

    // ========== 1:1 Chat Events ==========
    // Join chat room
    socket.on('joinChat', (chatId) => {
      socket.join(`chat:${chatId}`);
      console.log(`Socket ${socket.id} joined chat: ${chatId}`);
    });

    // Leave chat room
    socket.on('leaveChat', (chatId) => {
      socket.leave(`chat:${chatId}`);
      console.log(`Socket ${socket.id} left chat: ${chatId}`);
    });

    // User typing
    socket.on('typing', ({ chatId, userId }) => {
      socket.to(`chat:${chatId}`).emit('typing', { userId, chatId });
    });

    // User stopped typing
    socket.on('stopTyping', ({ chatId, userId }) => {
      socket.to(`chat:${chatId}`).emit('stopTyping', { userId, chatId });
    });

    // ========== Group Chat Events ==========
    // Join group room
    socket.on('joinGroup', (groupId) => {
      socket.join(`group:${groupId}`);
      console.log(`Socket ${socket.id} joined group: ${groupId}`);
    });

    // Leave group room
    socket.on('leaveGroup', (groupId) => {
      socket.leave(`group:${groupId}`);
      console.log(`Socket ${socket.id} left group: ${groupId}`);
    });

    // Group typing indicator
    socket.on('groupTyping', ({ groupId, userId }) => {
      socket.to(`group:${groupId}`).emit('groupTyping', { userId, groupId });
    });

    socket.on('groupStopTyping', ({ groupId, userId }) => {
      socket.to(`group:${groupId}`).emit('groupStopTyping', { userId, groupId });
    });

    // ========== Advanced Messaging Events ==========
    // Message quote
    socket.on('message:quote', ({ chatId, messageId, quotedMessageId }) => {
      socket.to(`chat:${chatId}`).emit('message:quote', {
        chatId,
        messageId,
        quotedMessageId,
      });
    });

    // Multi-select messages
    socket.on('messages:select', ({ chatId, messageIds }) => {
      socket.to(`chat:${chatId}`).emit('messages:select', {
        chatId,
        messageIds,
      });
    });

    // ========== Security Events ==========
    // Encrypted message
    socket.on('message:newEncrypted', ({ chatId, groupId, encryptedMessage }) => {
      if (chatId) {
        socket.to(`chat:${chatId}`).emit('message:newEncrypted', {
          chatId,
          encryptedMessage,
        });
      } else if (groupId) {
        socket.to(`group:${groupId}`).emit('message:newEncrypted', {
          groupId,
          encryptedMessage,
        });
      }
    });

    // Message deleted by retention policy
    socket.on('message:deletedByPolicy', ({ chatId, groupId, messageIds }) => {
      if (chatId) {
        socket.to(`chat:${chatId}`).emit('message:deletedByPolicy', {
          chatId,
          messageIds,
        });
      } else if (groupId) {
        socket.to(`group:${groupId}`).emit('message:deletedByPolicy', {
          groupId,
          messageIds,
        });
      }
    });

    // Message expired
    socket.on('message:expired', ({ chatId, groupId, messageId }) => {
      if (chatId) {
        socket.to(`chat:${chatId}`).emit('message:expired', {
          chatId,
          messageId,
        });
      } else if (groupId) {
        socket.to(`group:${groupId}`).emit('message:expired', {
          groupId,
          messageId,
        });
      }
    });

    // Chat locked
    socket.on('chat:lock', ({ chatId, groupId }) => {
      if (chatId) {
        socket.to(`chat:${chatId}`).emit('chat:lock', { chatId });
      } else if (groupId) {
        socket.to(`group:${groupId}`).emit('chat:lock', { groupId });
      }
    });

    // Chat unlocked
    socket.on('chat:unlock', ({ chatId, groupId }) => {
      if (chatId) {
        socket.to(`chat:${chatId}`).emit('chat:unlock', { chatId });
      } else if (groupId) {
        socket.to(`group:${groupId}`).emit('chat:unlock', { groupId });
      }
    });

    // Role updated
    socket.on('role:updated', ({ groupId, userId, newRole }) => {
      socket.to(`group:${groupId}`).emit('role:updated', {
        groupId,
        userId,
        newRole,
      });
      if (userId) {
        socket.to(`user:${userId}`).emit('role:updated', {
          groupId,
          userId,
          newRole,
        });
      }
    });

    // ========== Notification Events ==========
    // New notification (already handled by lib/notifications.js, but can be used for client-side)
    socket.on('notification:read', ({ notificationId }) => {
      // Client can notify server that notification was read
      // Server will update in database
    });

    // ========== User Presence ==========
    socket.on('user:join', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on('user:leave', (userId) => {
      if (userId) {
        socket.leave(`user:${userId}`);
      }
    });

    // ========== Admin Events ==========
    // User online status
    socket.on('user:online', async ({ userId, deviceInfo }) => {
      if (userId) {
        // Update ActiveUser collection
        const ActiveUser = (await import('../models/ActiveUser.js')).default;
        await ActiveUser.findOneAndUpdate(
          { userId, deviceId: deviceInfo?.deviceId },
          {
            userId,
            deviceId: deviceInfo?.deviceId || 'unknown',
            deviceName: deviceInfo?.deviceName,
            deviceType: deviceInfo?.deviceType,
            browser: deviceInfo?.browser,
            os: deviceInfo?.os,
            ipAddress: deviceInfo?.ipAddress,
            isOnline: true,
            lastActivityAt: new Date(),
            lastSeen: new Date(),
          },
          { upsert: true, new: true }
        );

        // Emit to admin users
        socket.to('admin:room').emit('user:online', { userId, deviceInfo });
      }
    });

    // User offline status
    socket.on('user:offline', async ({ userId, deviceId }) => {
      if (userId) {
        const ActiveUser = (await import('../models/ActiveUser.js')).default;
        await ActiveUser.findOneAndUpdate(
          { userId, deviceId },
          {
            isOnline: false,
            lastSeen: new Date(),
          }
        );

        socket.to('admin:room').emit('user:offline', { userId, deviceId });
      }
    });

    // User activity update
    socket.on('user:activity', async ({ userId, chatId, groupId }) => {
      if (userId) {
        const ActiveUser = (await import('../models/ActiveUser.js')).default;
        await ActiveUser.findOneAndUpdate(
          { userId, isOnline: true },
          {
            currentChatId: chatId || null,
            currentGroupId: groupId || null,
            lastActivityAt: new Date(),
          }
        );

        socket.to('admin:room').emit('user:activity', {
          userId,
          chatId,
          groupId,
        });
      }
    });

    // Admin joins admin room
    socket.on('admin:join', async () => {
      if (userId) {
        // Verify user is admin
        const { isAdmin } = await import('../lib/adminAuth.js');
        const admin = await isAdmin(userId);
        if (admin) {
          socket.join('admin:room');
        }
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      if (userId) {
        socket.leave(`user:${userId}`);
      }
    });
  });

  return globalForSocket.io;
}

export function getIO() {
  if (!globalForSocket.io) {
    console.warn('Socket.io not initialized yet. This might happen during hot reload.');
    // Return null instead of throwing to allow graceful degradation
    return null;
  }
  return globalForSocket.io;
}

// Helper function to emit group events
export function emitGroupEvent(groupId, event, data) {
  const io = getIO();
  if (io) {
    io.to(`group:${groupId}`).emit(event, data);
    console.log(`Emitted ${event} to group:${groupId}`);
  }
}
