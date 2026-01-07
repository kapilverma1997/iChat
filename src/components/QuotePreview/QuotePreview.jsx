"use client";

import Avatar from "../Avatar/Avatar.jsx";
import styles from "./QuotePreview.module.css";

export default function QuotePreview({ quotedMessage, onClose }) {
  if (!quotedMessage) return null;

  const formatTime = (date) => {
    if (!date) return "";
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "";
      return dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "";
    }
  };

  const getPreviewContent = () => {
    if (quotedMessage.type === "image" && quotedMessage.fileUrl) {
      return "📷 Photo";
    }
    if (quotedMessage.type === "video" && quotedMessage.fileUrl) {
      return "🎥 Video";
    }
    if (quotedMessage.type === "file" && quotedMessage.fileName) {
      return `📎 ${quotedMessage.fileName}`;
    }
    if (quotedMessage.type === "audio" || quotedMessage.type === "voice") {
      return "🎵 Audio";
    }
    return quotedMessage.content || "Message";
  };

  return (
    <div className={styles.quotePreview}>
      <div className={styles.quoteBar}></div>
      <div className={styles.quoteContent}>
        <div className={styles.quoteHeader}>
          {(() => {
            // Check privacy settings for profile photo
            const privacySettings = quotedMessage.senderId?.privacySettings || {};
            const showProfilePhoto = privacySettings.showProfilePhoto !== false; // Default to true if not set
            const profilePhotoSrc = showProfilePhoto ? quotedMessage.senderId?.profilePhoto : null;
            
            return (
              <Avatar
                src={profilePhotoSrc}
                name={quotedMessage.senderId?.name}
                size="small"
              />
            );
          })()}
          <span className={styles.quoteAuthor}>
            {quotedMessage.senderId?.name || "Unknown"}
          </span>
          <span className={styles.quoteTime}>
            {formatTime(quotedMessage.createdAt)}
          </span>
        </div>
        <div className={styles.quoteText}>{getPreviewContent()}</div>
      </div>
      {onClose && (
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
}

