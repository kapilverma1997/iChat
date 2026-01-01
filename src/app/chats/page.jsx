"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedLayout from "../../components/ProtectedLayout/ProtectedLayout.jsx";
import DashboardLayout from "../../components/DashboardLayout/DashboardLayout.jsx";
import Navbar from "../../components/Navbar/Navbar.jsx";
import ConfirmationDialog from "../../components/ConfirmationDialog/ConfirmationDialog.jsx";
import ForwardMessageModal from "../../components/ForwardMessageModal/ForwardMessageModal.jsx";
import GlobalSearchModal from "../../components/GlobalSearchModal/GlobalSearchModal.jsx";
import SuspiciousLoginAlert from "../../components/SuspiciousLoginAlert/SuspiciousLoginAlert.jsx";
import PushPermissionPopup from "../../components/PushPermissionPopup/PushPermissionPopup.jsx";
import ScheduleMessageModal from "../../components/ScheduleMessageModal/ScheduleMessageModal.jsx";
import ReminderModal from "../../components/ReminderModal/ReminderModal.jsx";
import { useSocket } from "../../hooks/useSocket.js";
import { usePresence } from "../../hooks/usePresence.js";
import { useToastNotifications } from "../../hooks/useToastNotifications.js";
import styles from "./page.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [quotedMessage, setQuotedMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [groups, setGroups] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [suspiciousLogin, setSuspiciousLogin] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState(null);
  const [reminderMessage, setReminderMessage] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const { socket, connected } = useSocket();
  const typingTimeoutRef = useRef({});

  usePresence();
  useToastNotifications(); // Enable real-time toast notifications

  useEffect(() => {
    fetchUser();
    // Make search modal accessible globally
    window.openSearchModal = () => setShowSearch(true);
    return () => {
      delete window.openSearchModal;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const archived = searchParams.get("archived") === "true";
    setShowArchived(archived);
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      if (showArchived) {
        fetchArchivedChats();
      } else {
        fetchChats();
      }
      fetchGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, showArchived]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat._id);
      // Wait for socket to be connected before joining
      if (socket && connected) {
        const chatId = activeChat._id.toString();
        socket.emit("joinChat", chatId);
        console.log("Joined active chat room:", chatId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat, socket, connected]);

  // Join all chats when socket connects to receive real-time messages
  useEffect(() => {
    if (socket && connected && chats.length > 0) {
      chats.forEach((chat) => {
        if (chat._id) {
          const chatId = chat._id.toString();
          socket.emit("joinChat", chatId);
          console.log("Joined chat room:", chatId);
        }
      });
      console.log(`Joined ${chats.length} chats for real-time updates`);
    }
  }, [socket, connected, chats]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch("/api/user/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/chat/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const fetchArchivedChats = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/chat/archived", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats);
        // Clear activeChat if there are no archived chats
        if (data.chats.length === 0 && activeChat) {
          setActiveChat(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Error fetching archived chats:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/groups/list?type=all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/messages/list?chatId=${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        // Refresh chat list to update unread count after marking messages as read
        if (showArchived) {
          fetchArchivedChats();
        } else {
          fetchChats();
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const joinChat = (chatId) => {
    if (socket && connected && chatId) {
      socket.emit("joinChat", chatId.toString());
      console.log("Joined chat:", chatId);
    }
  };

  const markMessagesAsRead = useCallback(
    async (messageIds, chatId) => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const response = await fetch("/api/messages/mark-read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messageIds,
            chatId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Update messages with readBy information
          if (data.messages && data.messages.length > 0) {
            setMessages((prev) =>
              prev.map((msg) => {
                const updatedMessage = data.messages.find(
                  (updatedMsg) =>
                    updatedMsg._id?.toString() === msg._id?.toString()
                );
                if (updatedMessage) {
                  return {
                    ...msg,
                    readBy: updatedMessage.readBy || msg.readBy,
                  };
                }
                return msg;
              })
            );
          }
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    },
    []
  );

  const handleReceiveMessage = useCallback(
    (data) => {
      console.log("Received message via socket:", data);
      // Convert chatId to string for comparison
      const receivedChatId = data.chatId?.toString();
      const currentChatId = activeChat?._id?.toString();

      // If this message is for the currently active chat, add it to messages
      if (activeChat && receivedChatId === currentChatId) {
        const messageId = data.message?._id?.toString();
        const senderId = data.message?.senderId?._id?.toString() || data.message?.senderId?.toString();
        const currentUserId = user?._id?.toString();

        // Check if message already exists to avoid duplicates
        setMessages((prev) => {
          if (!messageId) return prev;

          const exists = prev.some((msg) => {
            const msgId = msg._id?.toString();
            return msgId === messageId;
          });

          if (exists) {
            console.log("Duplicate message detected, skipping:", messageId);
            return prev;
          }

          console.log("Adding new message to active chat:", messageId);
          return [...prev, data.message];
        });

        // If message is not sent by current user and chat is active, mark it as read immediately
        if (messageId && senderId && currentUserId && senderId !== currentUserId) {
          console.log("Marking incoming message as read in real-time:", messageId);
          markMessagesAsRead([messageId], receivedChatId);
        }
      } else {
        // Message received for a different chat - refresh messages if user switches to it
        console.log("Message received for different chat:", receivedChatId);
      }

      // Always refresh chat list to update last message and unread count
      if (showArchived) {
        fetchArchivedChats();
      } else {
        fetchChats();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeChat, showArchived, user, markMessagesAsRead]
  );

  const handleTyping = useCallback(
    (data) => {
      if (
        activeChat &&
        data.chatId?.toString() === activeChat._id?.toString() &&
        data.userId?.toString() !== user?._id?.toString()
      ) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      }
    },
    [activeChat, user]
  );

  const handleStopTyping = useCallback(
    (data) => {
      if (
        activeChat &&
        data.chatId?.toString() === activeChat._id?.toString()
      ) {
        setTypingUsers((prev) =>
          prev.filter((id) => id?.toString() !== data.userId?.toString())
        );
      }
    },
    [activeChat]
  );

  const handleMessageDeleted = useCallback(
    (data) => {
      if (
        activeChat &&
        data.chatId?.toString() === activeChat._id?.toString()
      ) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id?.toString() === data.messageId?.toString()
              ? { ...msg, isDeleted: true, content: "This message was deleted" }
              : msg
          )
        );
      }
    },
    [activeChat]
  );

  const handleMessageDeleteForMe = useCallback(
    (data) => {
      if (
        activeChat &&
        data.chatId?.toString() === activeChat._id?.toString() &&
        data.userId?.toString() === user?._id?.toString()
      ) {
        // Remove message from UI when deleted for me
        setMessages((prev) =>
          prev.filter(
            (msg) => msg._id?.toString() !== data.messageId?.toString()
          )
        );
      }
    },
    [activeChat, user]
  );

  const handleMessageDeleteForEveryone = useCallback(
    (data) => {
      if (
        activeChat &&
        data.chatId?.toString() === activeChat._id?.toString()
      ) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id?.toString() === data.messageId?.toString()
              ? {
                  ...msg,
                  isDeleted: true,
                  isDeletedForEveryone: true,
                  content: "This message was deleted",
                }
              : msg
          )
        );
      }
    },
    [activeChat]
  );

  const handleReactionAdded = useCallback(
    (data) => {
      if (
        activeChat &&
        data.chatId?.toString() === activeChat._id?.toString()
      ) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id?.toString() === data.messageId?.toString()
              ? { ...msg, reactions: data.reactions }
              : msg
          )
        );
      }
    },
    [activeChat]
  );

  const handleMessageUpdated = useCallback(
    (data) => {
      if (
        activeChat &&
        data.chatId?.toString() === activeChat._id?.toString()
      ) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id?.toString() === data.message?._id?.toString()
              ? data.message
              : msg
          )
        );
      }
    },
    [activeChat]
  );

  const handleReadReceipts = useCallback(
    (data) => {
      if (
        activeChat &&
        data.chatId?.toString() === activeChat._id?.toString()
      ) {
        // Handle both new format (with messages array) and old format
        if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          // Update messages with new readBy information
          setMessages((prev) =>
            prev.map((msg) => {
              // Find if this message was updated with read receipt
              const updatedMessage = data.messages.find(
                (updatedMsg) =>
                  updatedMsg._id?.toString() === msg._id?.toString()
              );
              if (updatedMessage) {
                // Merge the updated readBy array into the existing message
                return {
                  ...msg,
                  readBy: updatedMessage.readBy || msg.readBy,
                };
              }
              return msg;
            })
          );
        } else {
          // Old format or no messages array - refresh messages to get updated readBy
          // This is a fallback for backward compatibility
          if (activeChat?._id) {
            fetchMessages(activeChat._id);
          }
        }
      }
    },
    [activeChat]
  );

  useEffect(() => {
    if (!socket || !connected) return;

    // Listen for both event names for compatibility
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("message:new", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("message:deleteForMe", handleMessageDeleteForMe);
    socket.on("message:deleteEveryone", handleMessageDeleteForEveryone);
    socket.on("reactionAdded", handleReactionAdded);
    socket.on("messageUpdated", handleMessageUpdated);
    socket.on("messages:readReceipts", handleReadReceipts);
    socket.on("messages:read", handleReadReceipts); // Also listen for backward compatibility

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("message:new", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("message:deleteForMe", handleMessageDeleteForMe);
      socket.off("message:deleteEveryone", handleMessageDeleteForEveryone);
      socket.off("reactionAdded", handleReactionAdded);
      socket.off("messageUpdated", handleMessageUpdated);
      socket.off("messages:readReceipts", handleReadReceipts);
      socket.off("messages:read", handleReadReceipts);
    };
  }, [
    socket,
    connected,
    handleReceiveMessage,
    handleTyping,
    handleStopTyping,
    handleMessageDeleted,
    handleMessageDeleteForMe,
    handleMessageDeleteForEveryone,
    handleReactionAdded,
    handleMessageUpdated,
    handleReadReceipts,
  ]);

  // Leave previous chat when switching
  useEffect(() => {
    return () => {
      if (socket && connected && activeChat) {
        socket.emit("leaveChat", activeChat._id.toString());
      }
    };
  }, [activeChat, socket, connected]);

  const handleSendMessage = async (
    content,
    replyToMessage,
    type = "text",
    additionalData = {}
  ) => {
    if (!activeChat) return;

    // Allow empty content for file-only messages
    if (!content && !additionalData.file && !additionalData.fileUrl) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");

      // Get quotedMessage from additionalData or state
      const messageToQuote = additionalData.quotedMessage || quotedMessage;

      // If there's a file, use upload endpoint
      if (additionalData.file) {
        const formData = new FormData();
        formData.append("file", additionalData.file);
        formData.append("chatId", activeChat._id);
        formData.append("type", type || "file");
        if (content) formData.append("content", content);
        if (replyToMessage?._id) formData.append("replyTo", replyToMessage._id);
        if (messageToQuote?._id)
          formData.append("quotedMessage", messageToQuote._id);
        if (additionalData.metadata) {
          formData.append("metadata", JSON.stringify(additionalData.metadata));
        }

        const response = await fetch("/api/messages/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setMessages((prev) => {
            const exists = prev.some(
              (msg) => msg._id?.toString() === data.message?._id?.toString()
            );
            if (exists) return prev;
            return [...prev, data.message];
          });
          setReplyTo(null);
          setQuotedMessage(null);
          fetchChats();
        }
        return;
      }

      // Regular message send
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId: activeChat._id,
          content: content || "",
          type: type || "text",
          replyTo: replyToMessage?._id,
          quotedMessage: messageToQuote?._id,
          fileUrl: additionalData.fileUrl || "",
          fileName: additionalData.fileName || "",
          fileSize: additionalData.fileSize || 0,
          metadata: additionalData.metadata || {},
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(
            (msg) => msg._id?.toString() === data.message?._id?.toString()
          );
          if (exists) return prev;
          return [...prev, data.message];
        });
        setReplyTo(null);
        setQuotedMessage(null);
        fetchChats();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleReplyMessage = (message) => {
    setReplyTo(message);
  };

  const handleQuoteMessage = (message) => {
    setQuotedMessage(message);
    setReplyTo(null); // Clear replyTo when quoting
  };

  const handleReactMessage = async (message, emoji) => {
    try {
      const token = localStorage.getItem("accessToken");
      await fetch("/api/messages/react", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId: message._id,
          emoji: emoji || "❤️",
        }),
      });
    } catch (error) {
      console.error("Error reacting to message:", error);
    }
  };

  const handleStarMessage = async (message) => {
    try {
      const token = localStorage.getItem("accessToken");
      await fetch("/api/messages/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId: message._id,
          isStarred: !message.isStarred,
        }),
      });
      fetchMessages(activeChat._id);
    } catch (error) {
      console.error("Error starring message:", error);
    }
  };

  const handlePinMessage = async (message) => {
    try {
      const token = localStorage.getItem("accessToken");
      await fetch("/api/messages/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId: message._id,
          isPinned: !message.isPinned,
        }),
      });
      fetchMessages(activeChat._id);
    } catch (error) {
      console.error("Error pinning message:", error);
    }
  };

  const handleDeleteMessage = async (message, forEveryone = false) => {
    // Show confirmation for both "Delete for Me" and "Delete for Everyone"
    setDeleteConfirm({
      type: "message",
      id: message._id,
      forEveryone: forEveryone,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await fetch(
            `/api/messages/delete?messageId=${message._id}&deleteForEveryone=${forEveryone}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.ok) {
            // Update local state immediately for "Delete for Me"
            if (!forEveryone) {
              setMessages((prev) =>
                prev.filter(
                  (msg) => msg._id?.toString() !== message._id?.toString()
                )
              );
            }
            fetchMessages(activeChat._id);
          }
        } catch (error) {
          console.error("Error deleting message:", error);
        } finally {
          setDeleteConfirm(null);
        }
      },
    });
  };

  const handleDeleteForEveryone = async (message) => {
    handleDeleteMessage(message, true);
  };

  const handleSelectMessage = (messageId) => {
    setSelectedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleClearSelection = () => {
    setSelectedMessages(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedMessages.size === 0) return;

    setDeleteConfirm({
      type: "messages",
      count: selectedMessages.size,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const messageIds = Array.from(selectedMessages);

          // Delete messages one by one (or implement bulk delete API if available)
          const deletePromises = messageIds.map((messageId) =>
            fetch(
              `/api/messages/delete?messageId=${messageId}&deleteForEveryone=false`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )
          );

          await Promise.all(deletePromises);

          // Update local state
          setMessages((prev) =>
            prev.filter((msg) => !selectedMessages.has(msg._id?.toString()))
          );

          setSelectedMessages(new Set());
          fetchMessages(activeChat._id);
        } catch (error) {
          console.error("Error deleting messages:", error);
        } finally {
          setDeleteConfirm(null);
        }
      },
    });
  };

  const handleEditMessage = async (messageId, content) => {
    try {
      const token = localStorage.getItem("accessToken");
      await fetch("/api/messages/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId,
          content,
        }),
      });
      fetchMessages(activeChat._id);
    } catch (error) {
      console.error("Error editing message:", error);
    }
  };

  const handleForwardMessage = (message) => {
    setForwardMessage(message);
  };

  const handleForward = async (message, targetChatId, targetGroupId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/messages/forward", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId: message._id,
          targetChatId,
          targetGroupId,
        }),
      });

      if (response.ok) {
        // Refresh chats to show updated last message
        fetchChats();
        fetchGroups();
      } else {
        const error = await response.json();
        console.error("Error forwarding message:", error);
      }
    } catch (error) {
      console.error("Error forwarding message:", error);
    }
  };

  const handleChatCreated = (chat) => {
    setChats((prev) => [chat, ...prev]);
    setActiveChat(chat);
  };

  const handleChatUpdated = (updatedChat) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat._id === updatedChat._id ? { ...chat, ...updatedChat } : chat
      )
    );
    if (activeChat && activeChat._id === updatedChat._id) {
      setActiveChat({ ...activeChat, ...updatedChat });
    }
    // If chat was unarchived and we're viewing archived chats, remove it from list
    if (showArchived && updatedChat.isArchived === false) {
      setChats((prev) => prev.filter((chat) => chat._id !== updatedChat._id));
    }
    // If chat was archived and we're viewing regular chats, remove it from list
    if (!showArchived && updatedChat.isArchived === true) {
      setChats((prev) => prev.filter((chat) => chat._id !== updatedChat._id));
    }
    // Join the chat room for real-time updates if socket is connected
    if (socket && connected && updatedChat._id) {
      socket.emit("joinChat", updatedChat._id.toString());
    }
  };

  const handleChatDeleted = async (chatId) => {
    const chat = chats.find((c) => c._id === chatId);
    if (!chat) return;

    setDeleteConfirm({
      type: "chat",
      id: chatId,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await fetch(`/api/chat/delete?chatId=${chatId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            setChats((prev) => prev.filter((chat) => chat._id !== chatId));
            if (activeChat && activeChat._id === chatId) {
              setActiveChat(null);
              setMessages([]);
            }
          }
        } catch (error) {
          console.error("Error deleting chat:", error);
        } finally {
          setDeleteConfirm(null);
        }
      },
    });
  };

  const handleTypingStart = () => {
    if (socket && activeChat) {
      socket.emit("typing", { chatId: activeChat._id, userId: user._id });
    }
  };

  const handleTypingStop = () => {
    if (socket && activeChat) {
      socket.emit("stopTyping", { chatId: activeChat._id, userId: user._id });
    }
  };

  const handleSetPriority = async (messageId, priority) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/messages/priority", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId,
          priority,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update message in messages list
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id?.toString() === messageId?.toString()
              ? { ...msg, priority: data.message.priority }
              : msg
          )
        );
        // Refresh chat list to show updated priority
        if (showArchived) {
          fetchArchivedChats();
        } else {
          fetchChats();
        }
      }
    } catch (error) {
      console.error("Error setting priority:", error);
    }
  };

  const handleAddTag = async (messageId, tag) => {
    try {
      const token = localStorage.getItem("accessToken");
      const message = messages.find(
        (m) => m._id?.toString() === messageId?.toString()
      );
      if (!message) return;

      const currentTags = message.tags || [];
      const newTags = [...currentTags, tag];

      const response = await fetch("/api/messages/tags", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId,
          tags: newTags,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update message in messages list
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id?.toString() === messageId?.toString()
              ? { ...msg, tags: data.message.tags }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };

  const handleRemoveTag = async (messageId, tag) => {
    try {
      const token = localStorage.getItem("accessToken");
      const message = messages.find(
        (m) => m._id?.toString() === messageId?.toString()
      );
      if (!message) return;

      const currentTags = message.tags || [];
      const newTags = currentTags.filter((t) => t !== tag);

      const response = await fetch("/api/messages/tags", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId,
          tags: newTags,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update message in messages list
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id?.toString() === messageId?.toString()
              ? { ...msg, tags: data.message.tags }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error removing tag:", error);
    }
  };

  const handleSchedule = (message) => {
    setScheduleMessage(message);
  };

  const handleRemind = (message) => {
    setReminderMessage(message);
  };

  const handleSetReminder = async (messageId, remindAt) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/messages/reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId,
          remindAt,
        }),
      });

      if (response.ok) {
        alert("Reminder set successfully!");
        setReminderMessage(null);
      } else {
        const error = await response.json();
        console.error("Error setting reminder:", error);
        alert("Failed to set reminder. Please try again.");
      }
    } catch (error) {
      console.error("Error setting reminder:", error);
      alert("Failed to set reminder. Please try again.");
    }
  };

  const handleScheduleSubmit = async (scheduledData) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/messages/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: scheduledData.content,
          type: scheduledData.type || "text",
          fileUrl: scheduledData.fileUrl || "",
          fileName: scheduledData.fileName || "",
          fileSize: scheduledData.fileSize || 0,
          metadata: scheduledData.metadata || {},
          sendAt: scheduledData.sendAt,
          targetChatId: activeChat?._id,
          priority: scheduledData.priority || "normal",
          tags: scheduledData.tags || [],
        }),
      });

      if (response.ok) {
        setScheduleMessage(null);
        // Optionally show success message
      } else {
        const error = await response.json();
        console.error("Error scheduling message:", error);
        alert("Failed to schedule message. Please try again.");
      }
    } catch (error) {
      console.error("Error scheduling message:", error);
      alert("Failed to schedule message. Please try again.");
    }
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <div className={styles.loading}>Loading...</div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <DashboardLayout
        chats={chats}
        activeChat={activeChat}
        messages={messages}
        currentUserId={user?._id}
        onSelectChat={(chat) => {
          setActiveChat(chat);
          setReplyTo(null);
          setQuotedMessage(null);
          setSelectedMessages(new Set()); // Clear selection when switching chats
        }}
        onSendMessage={handleSendMessage}
        onReplyMessage={handleReplyMessage}
        onQuoteMessage={handleQuoteMessage}
        onReactMessage={handleReactMessage}
        onStarMessage={handleStarMessage}
        onPinMessage={handlePinMessage}
        onDeleteMessage={handleDeleteMessage}
        onEditMessage={handleEditMessage}
        onForwardMessage={handleForwardMessage}
        onSetPriority={handleSetPriority}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        onSchedule={handleSchedule}
        onRemind={handleRemind}
        onDeleteForEveryone={handleDeleteForEveryone}
        selectedMessages={selectedMessages}
        onSelectMessage={handleSelectMessage}
        onClearSelection={handleClearSelection}
        onBulkDelete={handleBulkDelete}
        onChatCreated={handleChatCreated}
        onChatUpdated={handleChatUpdated}
        onChatDeleted={(chat) => handleChatDeleted(chat._id)}
        typingUsers={typingUsers}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        quotedMessage={quotedMessage}
        setQuotedMessage={setQuotedMessage}
        onTyping={handleTypingStart}
        onStopTyping={handleTypingStop}
      />
      {deleteConfirm && (
        <ConfirmationDialog
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={deleteConfirm.onConfirm}
          title={
            deleteConfirm.type === "chat" ? "Delete Chat" : "Delete Message"
          }
          message={
            deleteConfirm.type === "chat"
              ? "Are you sure you want to delete this chat? This action cannot be undone."
              : deleteConfirm.type === "messages"
              ? `Are you sure you want to delete ${deleteConfirm.count} ${
                  deleteConfirm.count === 1 ? "message" : "messages"
                }? This action cannot be undone.`
              : deleteConfirm.forEveryone
              ? "Are you sure you want to delete this message for everyone? This action cannot be undone."
              : "Are you sure you want to delete this message? This action cannot be undone."
          }
          confirmText="Delete"
          variant="danger"
        />
      )}
      {forwardMessage && (
        <ForwardMessageModal
          message={forwardMessage}
          chats={chats.filter((chat) => chat._id !== activeChat?._id)}
          groups={groups}
          onForward={handleForward}
          onClose={() => setForwardMessage(null)}
        />
      )}
      <GlobalSearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />
      {suspiciousLogin && (
        <SuspiciousLoginAlert
          sessionId={suspiciousLogin.sessionId}
          onDismiss={() => setSuspiciousLogin(null)}
        />
      )}
      {scheduleMessage && (
        <ScheduleMessageModal
          message={scheduleMessage}
          onSchedule={handleScheduleSubmit}
          onClose={() => setScheduleMessage(null)}
        />
      )}
      {reminderMessage && (
        <ReminderModal
          message={reminderMessage}
          onSetReminder={handleSetReminder}
          onClose={() => setReminderMessage(null)}
        />
      )}
      <PushPermissionPopup />
    </ProtectedLayout>
  );
}
