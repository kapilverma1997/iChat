"use client";

import { useState, useEffect, useRef } from "react";
import GroupMessageItem from "../GroupMessageItem/GroupMessageItem.jsx";
import GroupMessageInput from "../GroupMessageInput/GroupMessageInput.jsx";
import PinnedMessageBar from "../PinnedMessageBar/PinnedMessageBar.jsx";
import { useSocket } from "../../hooks/useSocket.js";
import styles from "./GroupMessageArea.module.css";

export default function GroupMessageArea({ group, currentUserId, userRole }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showThread, setShowThread] = useState(null);
  const { socket, connected } = useSocket();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (group?._id) {
      loadMessages();
      if (socket && connected) {
        socket.emit("joinGroup", group._id);
        socket.on("group:message", handleNewMessage);
        socket.on("group:threadMessage", handleThreadMessage);
        socket.on("groupTyping", handleTyping);
        socket.on("groupStopTyping", handleStopTyping);
      }
    }

    return () => {
      if (socket && connected && group?._id) {
        socket.emit("leaveGroup", group._id);
        socket.off("group:message");
        socket.off("group:threadMessage");
        socket.off("groupTyping");
        socket.off("groupStopTyping");
      }
    };
  }, [group?._id, socket, connected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/groups/messages/list?groupId=${group._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (data) => {
    if (data.groupId === group._id) {
      setMessages((prev) => [...prev, data.groupMessage]);
    }
  };

  const handleThreadMessage = (data) => {
    if (data.groupId === group._id) {
      // Update thread count on parent message
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.threadMessage.threadId
            ? { ...msg, threadCount: (msg.threadCount || 0) + 1 }
            : msg
        )
      );
    }
  };

  const handleTyping = ({ userId, groupId: typingGroupId }) => {
    if (typingGroupId === group._id && userId !== currentUserId) {
      setTypingUsers((prev) => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    }
  };

  const handleStopTyping = ({ userId, groupId: typingGroupId }) => {
    if (typingGroupId === group._id) {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleSendMessage = async (content, replyToId, type, fileData) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/groups/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId: group._id,
          content,
          type: type || "text",
          replyTo: replyToId,
          fileUrl: fileData?.fileUrl || "",
          fileName: fileData?.fileName || "",
          fileSize: fileData?.fileSize || 0,
          metadata: fileData?.metadata || {},
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.groupMessage]);
        setReplyTo(null);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleReact = async (message, emoji) => {
    // Implement reaction logic
    console.log("React to message:", message._id, emoji);
  };

  const handleDelete = async (message) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/groups/messages/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageId: message._id }),
      });

      if (response.ok) {
        setMessages((prev) => prev.filter((msg) => msg._id !== message._id));
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const pinnedMessages = group.pinnedMessages || [];

  return (
    <div className={styles.container}>
      {pinnedMessages.length > 0 && (
        <PinnedMessageBar
          pinnedMessages={pinnedMessages}
          onClose={() => {}}
        />
      )}
      <div className={styles.messages}>
        {loading ? (
          <div className={styles.loading}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className={styles.empty}>No messages yet. Start the conversation!</div>
        ) : (
          <>
            {messages.map((message) => (
              <GroupMessageItem
                key={message._id}
                message={message}
                currentUserId={currentUserId}
                userRole={userRole}
                group={group}
                onReply={setReplyTo}
                onReact={handleReact}
                onDelete={handleDelete}
                onThreadClick={setShowThread}
              />
            ))}
            {typingUsers.length > 0 && (
              <div className={styles.typing}>
                {typingUsers.length} user{typingUsers.length > 1 ? "s" : ""} typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <GroupMessageInput
        group={group}
        userRole={userRole}
        replyTo={replyTo}
        onSend={handleSendMessage}
        onCancelReply={() => setReplyTo(null)}
        socket={socket}
      />
    </div>
  );
}

