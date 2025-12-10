"use client";

import Avatar from "../Avatar/Avatar.jsx";
import styles from "./GroupItem.module.css";

export default function GroupItem({ group, isActive, onClick }) {
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

  const getGroupTypeBadge = () => {
    if (group.groupType === "announcement") return "📢";
    if (group.groupType === "private") return "🔒";
    return "🌐";
  };

  const lastMessage = group.lastMessage;
  const memberCount = group.memberCount || group.members?.length || 0;

  return (
    <div
      className={`${styles.item} ${isActive ? styles.active : ""}`}
      onClick={onClick}
    >
      <Avatar
        src={group.groupPhoto}
        name={group.name}
        size="medium"
      />
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.name}>
            {getGroupTypeBadge()} {group.name}
          </span>
          <span className={styles.time}>
            {formatTime(group.lastMessageAt)}
          </span>
        </div>
        <div className={styles.footer}>
          <span className={styles.lastMessage}>
            {lastMessage?.content || "No messages yet"}
          </span>
          <span className={styles.memberCount}>{memberCount} members</span>
        </div>
      </div>
    </div>
  );
}

