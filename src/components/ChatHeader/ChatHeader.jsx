"use client";

import Avatar from "../Avatar/Avatar.jsx";
import { formatLastSeen } from "../../lib/utils.js";
import styles from "./ChatHeader.module.css";

export default function ChatHeader({ user, chat, onUserClick }) {
  if (!user) return null;

  // Check privacy settings for profile photo and last seen
  const privacySettings = user?.privacySettings || {};
  const showProfilePhoto = privacySettings.showProfilePhoto !== false; // Default to true if not set
  const showLastSeen = privacySettings.showLastSeen !== false; // Default to true if not set
  const profilePhotoSrc = showProfilePhoto ? user?.profilePhoto : null;

  // Check chat settings for online status visibility
  const chatSettings = user?.chatSettings || {};
  const showOnlineStatus = chatSettings.showOnlineStatus !== false; // Default to true if not set

  const getStatusText = () => {
    // If showOnlineStatus is false, don't show online status
    if (!showOnlineStatus) {
      // Still check last seen privacy setting
      if (!showLastSeen) {
        return "Offline";
      }
      return formatLastSeen(user.lastSeen);
    }

    if (user.presenceStatus === "online") {
      return "Online";
    }
    if (user.presenceStatus === "away") {
      return "Away";
    }
    if (user.presenceStatus === "do-not-disturb") {
      return "Do not disturb";
    }
    // Check privacy setting before showing last seen
    if (!showLastSeen) {
      return "Offline";
    }
    return formatLastSeen(user.lastSeen);
  };

  const handleNameClick = (e) => {
    e.stopPropagation();
    if (onUserClick && user._id) {
      onUserClick(user._id);
    }
  };

  return (
    <div className={styles.header}>
      <Avatar
        src={profilePhotoSrc}
        name={user.name}
        size="medium"
        status={showOnlineStatus ? user.presenceStatus : null}
      />
      <div className={styles.info}>
        <div 
          className={styles.name} 
          onClick={handleNameClick}
          style={{ cursor: onUserClick ? 'pointer' : 'default' }}
        >
          {user.name}
        </div>
        <div className={styles.status}>{getStatusText()}</div>
      </div>
    </div>
  );
}
