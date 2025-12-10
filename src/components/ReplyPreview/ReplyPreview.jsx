"use client";

import styles from "./ReplyPreview.module.css";

export default function ReplyPreview({ message, onClose }) {
  if (!message) return null;

  return (
    <div className={styles.replyPreview}>
      <div className={styles.content}>
        <div className={styles.sender}>
          {message.senderId?.name || "Unknown"}
        </div>
        <div className={styles.text}>{message.content}</div>
      </div>
      <button className={styles.close} onClick={onClose}>
        ×
      </button>
    </div>
  );
}
