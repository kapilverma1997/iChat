'use client';

import { useEffect, useState, useRef } from 'react';
import { useSocket } from './useSocket';
import { useToast } from '../contexts/ToastContext';
import { useRouter } from 'next/navigation';

export function useToastNotifications() {
  const { socket, connected } = useSocket();
  const { addToast } = useToast();
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState(null);
  // Use ref to persist processed message IDs across renders
  const processedMessageIdsRef = useRef(new Set());

  // Fetch current user ID to filter out own messages
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const response = await fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.user?._id?.toString());
        }
      } catch (error) {
        console.error("Error fetching user for toast notifications:", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    console.log("useToastNotifications: Setting up event listeners", { socket: !!socket, connected });
    if (!socket || !connected) {
      console.log("useToastNotifications: Socket not ready", { socket: !!socket, connected });
      return;
    }

    console.log("useToastNotifications: Setting up event listeners", { socketId: socket.id, connected });

    // Listen for new notifications
    const handleNotification = (data) => {
      const { notification } = data;

      if (!notification) return;

      // Don't show toast if user is viewing the same chat
      if (notification.chatId) {
        const urlParams = new URLSearchParams(window.location.search);
        const activeChatId = urlParams.get('chatId');
        const notificationChatId = notification.chatId?.toString();

        // Don't show toast if user is viewing this specific chat
        if (activeChatId && notificationChatId && activeChatId === notificationChatId) {
          return;
        }
      }

      // Use messageId if available for consistent ID tracking
      const messageId = notification.messageId?.toString() || notification._id?.toString();
      const toastId = messageId || `notification-${Date.now()}-${Math.random()}`;

      // Mark this message as processed to prevent duplicate from message:new
      if (notification.messageId) {
        processedMessageIdsRef.current.add(notification.messageId.toString());
      }

      addToast({
        id: toastId,
        type: notification.type || 'default',
        title: notification.title || 'New Notification',
        body: notification.body || '',
        duration: notification.priority === 'urgent' ? 8000 : 5000,
        playSound: true,
        onClick: () => {
          // Navigate to relevant page based on notification type
          if (notification.chatId) {
            router.push(`/chats?chatId=${notification.chatId}`);
          } else if (notification.groupId) {
            router.push(`/groups/${notification.groupId}`);
          }
        },
        notification,
      });
    };

    // Listen for new messages (for real-time toast notifications)
    // Only show toast if notification:new wasn't already triggered for this message
    const handleNewMessage = (data) => {
      console.log("useToastNotifications: Received message:new event", data);
      const { message, notification, chatId } = data;
      if (!message) {
        console.log("useToastNotifications: No message in data, returning");
        return;
      }

      const messageId = message._id?.toString();

      // Skip if this message was already processed via notification:new
      if (messageId && processedMessageIdsRef.current.has(messageId)) {
        console.log("useToastNotifications: Message already processed via notification:new, skipping");
        return;
      }

      // Skip if this is the current user's own message
      const senderId = message.senderId?._id?.toString() || message.senderId?.toString();
      if (senderId && currentUserId && senderId === currentUserId) {
        console.log("useToastNotifications: Skipping toast for own message");
        return;
      }

      // Get sender name
      const senderName = message.senderId?.name ||
        message.senderId?.email ||
        notification?.data?.senderName ||
        'Someone';

      // Get message content
      const messageContent = message.content ||
        notification?.body ||
        notification?.data?.messageContent ||
        'Sent a message';

      // Check if user is currently viewing this chat
      // Get chatId from URL params or from the message data
      const urlParams = new URLSearchParams(window.location.search);
      const activeChatId = urlParams.get('chatId');
      const messageChatId = chatId || message.chatId;

      // Don't show toast if user is viewing this specific chat
      if (activeChatId && messageChatId && activeChatId === messageChatId.toString()) {
        console.log("useToastNotifications: User is viewing this chat, skipping toast");
        return;
      }

      // Mark as processed
      if (messageId) {
        processedMessageIdsRef.current.add(messageId);
      }

      console.log("useToastNotifications: Showing toast for new message", { senderName, messageChatId });

      // Use message ID for consistent duplicate prevention (same format as notification:new)
      addToast({
        id: messageId || `message-${Date.now()}-${Math.random()}`,
        type: 'message',
        title: `New message from ${senderName}`,
        body: messageContent.length > 100
          ? messageContent.substring(0, 100) + '...'
          : messageContent,
        duration: 5000,
        playSound: true,
        onClick: () => {
          router.push(`/chats?chatId=${chatId || message.chatId}`);
        },
        message,
        chatId,
      });
    };

    // Also handle receiveMessage event (old event name for compatibility)
    const handleReceiveMessage = (data) => {
      console.log("useToastNotifications: Received receiveMessage event (old event name)", data);
      // Call the same handler as message:new
      handleNewMessage(data);
    };

    // Listen for mentions
    const handleMention = (data) => {
      const { notification } = data;

      if (!notification) return;

      addToast({
        id: notification._id,
        type: 'mention',
        title: notification.title || 'You were mentioned',
        body: notification.body || '',
        duration: 6000,
        playSound: true,
        onClick: () => {
          if (notification.chatId) {
            router.push(`/chats?chatId=${notification.chatId}`);
          } else if (notification.groupId) {
            router.push(`/groups/${notification.groupId}`);
          }
        },
        notification,
      });
    };

    // Register event listeners - listen to both event names
    // Socket.io supports multiple listeners for the same event, so we don't need to remove others
    console.log("useToastNotifications: Registering event listeners for 'notification:new', 'message:new', and 'receiveMessage'");

    // Register listeners - these will be called along with any other listeners for the same events
    socket.on('notification:new', handleNotification);
    socket.on('message:new', handleNewMessage);
    socket.on('receiveMessage', handleReceiveMessage);

    console.log("useToastNotifications: Event listeners registered successfully", {
      socketId: socket.id,
      connected: connected
    });

    // Debug: Log all socket events to see what's being received
    const debugHandler = (eventName, ...args) => {
      if (eventName === 'message:new' || eventName === 'notification:new' || eventName === 'receiveMessage') {
        console.log(`useToastNotifications: Socket event received via onAny: ${eventName}`, args);
      }
    };

    // Listen to all events for debugging (if available)
    if (socket.onAny) {
      socket.onAny(debugHandler);
    }

    // Cleanup - remove only our specific listeners
    return () => {
      console.log("useToastNotifications: Cleaning up event listeners");
      // Remove our specific listeners using the handler functions
      socket.off('notification:new', handleNotification);
      socket.off('message:new', handleNewMessage);
      socket.off('receiveMessage', handleReceiveMessage);
      if (socket.offAny) {
        socket.offAny(debugHandler);
      }
    };
  }, [socket, connected, addToast, router, currentUserId]);
}

