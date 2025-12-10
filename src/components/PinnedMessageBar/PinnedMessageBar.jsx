"use client";

import styles from "./PinnedMessageBar.module.css";

export default function PinnedMessageBar({ pinnedMessages, onClose }) {
  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const latestPin = pinnedMessages[pinnedMessages.length - 1];
  const message = latestPin.messageId;

  return (
    <div className={styles.bar}>
      <div className={styles.content}>
        <span className={styles.icon}>📌</span>
        <div className={styles.messageInfo}>
          <div className={styles.messageText}>
            {message?.content || "Pinned message"}
          </div>
          <div className={styles.pinnedBy}>
            Pinned by {latestPin.pinnedBy?.name || "Admin"}
          </div>
        </div>
      </div>
      <button className={styles.closeButton} onClick={onClose}>
        ×
      </button>
    </div>
  );
}

