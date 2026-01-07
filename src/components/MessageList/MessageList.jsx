"use client";

import { useEffect, useRef, useState } from "react";
import MessageItem from "../MessageItem/MessageItem.jsx";
import styles from "./MessageList.module.css";

export default function MessageList({
  messages,
  currentUserId,
  onReply,
  onQuote,
  onReact,
  onStar,
  onPin,
  onDelete,
  onEdit,
  onForward,
  onSetPriority,
  onAddTag,
  onRemoveTag,
  onSchedule,
  onRemind,
  onDeleteForEveryone,
  selectedMessages,
  onSelectMessage,
  typingUsers = [],
}) {
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);
  const [displaySettings, setDisplaySettings] = useState({
    messageDensity: "comfortable",
  });

  useEffect(() => {
    const fetchDisplaySettings = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user?.displaySettings) {
            setDisplaySettings({
              messageDensity: data.user.displaySettings.messageDensity || "comfortable",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching display settings:", error);
      }
    };
    fetchDisplaySettings();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Filter out duplicate messages based on _id to prevent React key errors
  const uniqueMessages = messages.filter((message, index, self) => {
    const messageId = message._id?.toString();
    if (!messageId) return false;
    return index === self.findIndex((m) => m._id?.toString() === messageId);
  });

  const densityMap = {
    'compact': 'densityCompact',
    'comfortable': 'densityComfortable',
    'spacious': 'densitySpacious',
  };
  const densityClass = styles[densityMap[displaySettings.messageDensity]] || '';

  return (
    <div ref={listRef} className={`${styles.list} ${densityClass}`}>
      {uniqueMessages.map((message) => (
        <MessageItem
          key={message._id}
          message={message}
          isOwn={
            message.senderId?._id?.toString() === currentUserId?.toString()
          }
          currentUserId={currentUserId}
          onReply={onReply}
          onQuote={onQuote}
          onReact={onReact}
          onStar={onStar}
          onPin={onPin}
          onDelete={onDelete}
          onEdit={onEdit}
          onForward={onForward}
          onSetPriority={onSetPriority}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          onSchedule={onSchedule}
          onRemind={onRemind}
          onDeleteForEveryone={onDeleteForEveryone}
          isSelected={selectedMessages?.has(message._id?.toString()) || false}
          onSelect={onSelectMessage}
        />
      ))}
      {typingUsers.length > 0 && (
        <div className={styles.typing}>
          {typingUsers.map((userId) => (
            <span key={userId} className={styles.typingText}>
              User is typing...
            </span>
          ))}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
