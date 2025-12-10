"use client";

import { useState } from "react";
import Avatar from "../Avatar/Avatar.jsx";
import ReplyPreview from "../ReplyPreview/ReplyPreview.jsx";
import ReactionList from "../ReactionList/ReactionList.jsx";
import { canDeleteMessage } from "../../../lib/groupPermissions.js";
import styles from "./GroupMessageItem.module.css";

export default function GroupMessageItem({
  message,
  currentUserId,
  userRole,
  group,
  onReply,
  onReact,
  onDelete,
  onThreadClick,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isOwn = message.senderId?._id?.toString() === currentUserId?.toString();
  const canDelete = canDeleteMessage(
    group,
    userRole,
    message.senderId?._id || message.senderId,
    currentUserId
  );
  const threadCount = message.threadCount || 0;

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderContent = () => {
    if (message.isDeleted) {
      return <div className={styles.deleted}>This message was deleted</div>;
    }

    switch (message.type) {
      case "image":
        return (
          <>
            {message.fileUrl && (
              <img src={message.fileUrl} alt={message.fileName} className={styles.image} />
            )}
            {message.content && <div className={styles.text}>{message.content}</div>}
          </>
        );
      case "video":
        return (
          <>
            {message.fileUrl && (
              <video src={message.fileUrl} controls className={styles.video} />
            )}
            {message.content && <div className={styles.text}>{message.content}</div>}
          </>
        );
      case "file":
        return (
          <div className={styles.file}>
            <a href={message.fileUrl} download={message.fileName}>
              📎 {message.fileName} ({(message.fileSize / 1024).toFixed(2)} KB)
            </a>
            {message.content && <div className={styles.text}>{message.content}</div>}
          </div>
        );
      case "poll":
        return <div className={styles.poll}>📊 Poll: {message.content}</div>;
      case "event":
        return <div className={styles.event}>📅 Event: {message.content}</div>;
      default:
        return <div className={styles.text}>{message.content}</div>;
    }
  };

  return (
    <div className={`${styles.message} ${isOwn ? styles.own : ""}`}>
      {!isOwn && (
        <Avatar
          src={message.senderId?.profilePhoto}
          name={message.senderId?.name}
          size="small"
        />
      )}
      <div className={styles.content}>
        {!isOwn && (
          <div className={styles.senderName}>{message.senderId?.name}</div>
        )}
        {message.replyTo && (
          <ReplyPreview message={message.replyTo} onClose={() => {}} />
        )}
        <div className={styles.bubble}>
          {renderContent()}
          {message.reactions && message.reactions.length > 0 && (
            <ReactionList
              reactions={message.reactions}
              currentUserId={currentUserId}
              onReactionClick={(emoji) => onReact(message, emoji)}
            />
          )}
        </div>
        <div className={styles.meta}>
          <span className={styles.time}>{formatTime(message.createdAt)}</span>
          {threadCount > 0 && (
            <button
              className={styles.threadButton}
              onClick={() => onThreadClick(message)}
            >
              {threadCount} reply{threadCount > 1 ? "ies" : ""}
            </button>
          )}
        </div>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.actionButton}
          onClick={() => setShowMenu(!showMenu)}
        >
          ⋮
        </button>
        {showMenu && (
          <div className={styles.menu}>
            <button
              onClick={() => {
                onReply(message);
                setShowMenu(false);
              }}
            >
              Reply
            </button>
            {group.settings?.allowReplies && (
              <button
                onClick={() => {
                  onThreadClick(message);
                  setShowMenu(false);
                }}
              >
                View Thread
              </button>
            )}
            {canDelete && (
              <button
                className={styles.delete}
                onClick={() => {
                  onDelete(message);
                  setShowMenu(false);
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

