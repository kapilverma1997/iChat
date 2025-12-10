"use client";

import React from "react";
import styles from "./ProfileCard.module.css";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";

// Format last seen timestamp
function formatLastSeen(lastSeen) {
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else {
    return lastSeen.toLocaleDateString();
  }
}

export default function ProfileCard({
  user,
  showActions = false,
  onEdit,
  className = "",
}) {
  const privacySettings = user.privacySettings || {
    showProfilePhoto: true,
    showLastSeen: true,
    showStatus: true,
    showDesignation: true,
  };

  const lastSeenDate =
    typeof user.lastSeen === "string" ? new Date(user.lastSeen) : user.lastSeen;
  const lastSeenText = formatLastSeen(lastSeenDate);

  return (
    <div className={`${styles.profileCard} ${className}`}>
      <div className={styles.avatarSection}>
        {privacySettings.showProfilePhoto && user.profilePhoto ? (
          <img
            src={user.profilePhoto}
            alt={user.name}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className={styles.statusContainer}>
          <StatusBadge status={user.presenceStatus} size="large" />
        </div>
      </div>

      <div className={styles.infoSection}>
        <h2 className={styles.name}>{user.name}</h2>
        {privacySettings.showDesignation && user.designation && (
          <p className={styles.designation}>{user.designation}</p>
        )}
        {privacySettings.showStatus && user.statusMessage && (
          <p className={styles.statusMessage}>{user.statusMessage}</p>
        )}
        {privacySettings.showLastSeen && (
          <p className={styles.lastSeen}>
            {user.presenceStatus === "online"
              ? "Online"
              : `Last seen ${lastSeenText}`}
          </p>
        )}
        <p className={styles.email}>{user.email}</p>
      </div>

      {showActions && onEdit && (
        <div className={styles.actions}>
          <button type="button" onClick={onEdit} className={styles.editButton}>
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
}
