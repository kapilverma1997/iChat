"use client";

import { useEffect, useRef } from "react";
import MessageItem from "../MessageItem/MessageItem.jsx";
import styles from "./MessageList.module.css";

export default function MessageList({
  messages,
  currentUserId,
  onReply,
  onReact,
  onStar,
  onPin,
  onDelete,
  onEdit,
  onForward,
  typingUsers = [],
}) {
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);

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

  return (
    <div ref={listRef} className={styles.list}>
      {uniqueMessages.map((message) => (
        <MessageItem
          key={message._id}
          message={message}
          isOwn={
            message.senderId?._id?.toString() === currentUserId?.toString()
          }
          currentUserId={currentUserId}
          onReply={onReply}
          onReact={onReact}
          onStar={onStar}
          onPin={onPin}
          onDelete={onDelete}
          onEdit={onEdit}
          onForward={onForward}
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
