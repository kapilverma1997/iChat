"use client";

import { useState, useEffect } from "react";
import { useSocket } from "../../hooks/useSocket.js";
import styles from "./PinnedMessagesPanel.module.css";

export default function PinnedMessagesPanel({ chatId, groupId, onMessageClick }) {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, connected } = useSocket();

  useEffect(() => {
    fetchPinnedMessages();
  }, [chatId, groupId]);

  useEffect(() => {
    if (!socket || !connected) return;

    const handlePinnedUpdate = (data) => {
      if (
        data.action === "pinned" ||
        data.action === "unpinned" ||
        data.action === "updated"
      ) {
        fetchPinnedMessages();
      }
    };

    socket.on("message:pinned", handlePinnedUpdate);

    return () => {
      socket.off("message:pinned", handlePinnedUpdate);
    };
  }, [socket, connected, chatId, groupId]);

  const fetchPinnedMessages = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const params = new URLSearchParams();
      if (chatId) params.append("chatId", chatId);
      if (groupId) params.append("groupId", groupId);

      const response = await fetch(`/api/messages/pin?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPinnedMessages(data.pinnedMessages || []);
      }
    } catch (error) {
      console.error("Error fetching pinned messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async (pinnedMessageId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to unpin this message?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await fetch(`/api/messages/pin?pinnedMessageId=${pinnedMessageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPinnedMessages();
    } catch (error) {
      console.error("Error unpinning message:", error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading pinned messages...</div>;
  }

  if (pinnedMessages.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No pinned messages</p>
      </div>
    );
  }

  return (
    <div className={styles.pinnedPanel}>
      <div className={styles.header}>
        <h3>📌 Pinned Messages ({pinnedMessages.length})</h3>
      </div>
      <div className={styles.messages}>
        {pinnedMessages.map((pinned) => (
          <div
            key={pinned._id}
            className={styles.pinnedItem}
            onClick={() => onMessageClick && onMessageClick(pinned.messageId)}
          >
            <div className={styles.messageContent}>
              {pinned.messageId?.content && (
                <p className={styles.messageText}>
                  {pinned.messageId.content.substring(0, 100)}
                  {pinned.messageId.content.length > 100 ? "..." : ""}
                </p>
              )}
              <div className={styles.messageMeta}>
                <span className={styles.pinnedBy}>
                  Pinned by {pinned.pinnedBy?.name}
                </span>
                <span className={styles.pinnedAt}>
                  {new Date(pinned.pinnedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => handleUnpin(pinned._id, e)}
              className={styles.unpinButton}
              title="Unpin"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

