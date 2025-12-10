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

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
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
