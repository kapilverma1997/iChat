"use client";

import { useState, useEffect, useRef } from "react";
import Avatar from "../Avatar/Avatar.jsx";
import { parseMarkdown } from "../../lib/markdown.js";
import styles from "./ChatListItem.module.css";

export default function ChatListItem({
  chat,
  isActive,
  onClick,
  onPin,
  onMute,
  onArchive,
  onMarkUnread,
  onDelete,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showMenu &&
        menuRef.current &&
        menuButtonRef.current &&
        !menuRef.current.contains(event.target) &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const otherUser = chat.otherUser;
  const lastMessage = chat.lastMessage;
  const unreadCount = chat.unreadCount || 0;

  // Check privacy settings for profile photo
  const privacySettings = otherUser?.privacySettings || {};
  const showProfilePhoto = privacySettings.showProfilePhoto !== false; // Default to true if not set
  const profilePhotoSrc = showProfilePhoto ? otherUser?.profilePhoto : null;

  // Check chat settings for online status visibility
  const chatSettings = otherUser?.chatSettings || {};
  const showOnlineStatus = chatSettings.showOnlineStatus !== false; // Default to true if not set

  const formatTime = (date) => {
    if (!date) return "";
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return messageDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays < 7) {
      return messageDate.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return messageDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div
      className={`${styles.item} ${isActive ? styles.active : ""}`}
      onClick={onClick}
    >
      <Avatar
        src={profilePhotoSrc}
        name={otherUser?.name}
        size="medium"
        status={showOnlineStatus ? otherUser?.presenceStatus : null}
      />
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.name}>
            {chat.isPinned && <span className={styles.pinIcon}>📌</span>}
            {otherUser?.name || "Unknown"}
          </span>
          <span className={styles.time}>{formatTime(chat.lastMessageAt)}</span>
        </div>
        <div className={styles.footer}>
          <span
            className={styles.lastMessage}
            dangerouslySetInnerHTML={{
              __html: parseMarkdown(lastMessage?.content || ""),
            }}
          />
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount}</span>
          )}
        </div>
      </div>
      <div className={styles.menu}>
        <button
          ref={menuButtonRef}
          className={styles.menuButton}
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          ⋮
        </button>
        {showMenu && (
          <div ref={menuRef} className={styles.menuDropdown}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPin();
                setShowMenu(false);
              }}
            >
              {chat.isPinned ? "Unpin" : "Pin"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMute();
                setShowMenu(false);
              }}
            >
              {chat.isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
                setShowMenu(false);
              }}
            >
              {chat.isArchived ? "Unarchive" : "Archive"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkUnread();
                setShowMenu(false);
              }}
            >
              Mark as unread
            </button>
            <button
              className={styles.delete}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowMenu(false);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
