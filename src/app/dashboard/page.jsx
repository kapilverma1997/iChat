"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../../components/ProtectedLayout/ProtectedLayout.jsx";
import DashboardLayout from "../../components/DashboardLayout/DashboardLayout.jsx";
import Navbar from "../../components/Navbar/Navbar.jsx";
import ConfirmationDialog from "../../components/ConfirmationDialog/ConfirmationDialog.jsx";
import { useSocket } from "../../hooks/useSocket.js";
import { usePresence } from "../../hooks/usePresence.js";
import styles from "./page.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { socket, connected } = useSocket();
  const typingTimeoutRef = useRef({});

  usePresence();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat._id);
      // Wait for socket to be connected before joining
      if (socket && connected) {
        joinChat(activeChat._id);
      }
    }
  }, [activeChat, socket, connected]);

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

  const handleReceiveMessage = useCallback(
    (data) => {
      console.log("Received message:", data);
      // Convert chatId to string for comparison
      const receivedChatId = data.chatId?.toString();
      const currentChatId = activeChat?._id?.toString();

      if (activeChat && receivedChatId === currentChatId) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          // Compare both _id and content to handle edge cases
          const messageId = data.message?._id?.toString();
          if (!messageId) return prev;

          const exists = prev.some((msg) => {
            const msgId = msg._id?.toString();
            return msgId === messageId;
          });

          if (exists) {
            console.log("Duplicate message detected, skipping:", messageId);
            return prev;
          }

          return [...prev, data.message];
        });
      }
      // Always refresh chat list to update last message
      fetchChats();
    },
    [activeChat]
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

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("reactionAdded", handleReactionAdded);
    socket.on("messageUpdated", handleMessageUpdated);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("reactionAdded", handleReactionAdded);
      socket.off("messageUpdated", handleMessageUpdated);
    };
  }, [
    socket,
    connected,
    handleReceiveMessage,
    handleTyping,
    handleStopTyping,
    handleMessageDeleted,
    handleReactionAdded,
    handleMessageUpdated,
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

      // If there's a file, use upload endpoint
      if (additionalData.file) {
        const formData = new FormData();
        formData.append("file", additionalData.file);
        formData.append("chatId", activeChat._id);
        formData.append("type", type || "file");
        if (content) formData.append("content", content);
        if (replyToMessage?._id) formData.append("replyTo", replyToMessage._id);
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
        fetchChats();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleReplyMessage = (message) => {
    setReplyTo(message);
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

  const handleDeleteMessage = async (message) => {
    setDeleteConfirm({
      type: "message",
      id: message._id,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          await fetch(`/api/messages/delete?messageId=${message._id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          fetchMessages(activeChat._id);
        } catch (error) {
          console.error("Error deleting message:", error);
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
  };

  const handleChatDeleted = (chatId) => {
    setChats((prev) => prev.filter((chat) => chat._id !== chatId));
    if (activeChat && activeChat._id === chatId) {
      setActiveChat(null);
      setMessages([]);
    }
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

  if (loading) {
    return (
      <ProtectedLayout>
        <div className={styles.loading}>Loading...</div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      {/* <Navbar /> */}
      <DashboardLayout
        chats={chats}
        activeChat={activeChat}
        messages={messages}
        currentUserId={user?._id}
        onSelectChat={(chat) => {
          setActiveChat(chat);
          setReplyTo(null);
        }}
        onSendMessage={handleSendMessage}
        onReplyMessage={handleReplyMessage}
        onReactMessage={handleReactMessage}
        onStarMessage={handleStarMessage}
        onPinMessage={handlePinMessage}
        onDeleteMessage={handleDeleteMessage}
        onEditMessage={handleEditMessage}
        onChatCreated={handleChatCreated}
        onChatUpdated={handleChatUpdated}
        onChatDeleted={handleChatDeleted}
        typingUsers={typingUsers}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        onTyping={handleTypingStart}
        onStopTyping={handleTypingStop}
      />
      {deleteConfirm && (
        <ConfirmationDialog
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={deleteConfirm.onConfirm}
          title="Delete Message"
          message="Are you sure you want to delete this message? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
        />
      )}
    </ProtectedLayout>
  );
}
