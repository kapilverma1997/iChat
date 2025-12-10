"use client";

import styles from "./Avatar.module.css";

export default function Avatar({ src, alt, name, size = "medium", status }) {
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const statusClass = status ? styles[status] : "";

  return (
    <div className={`${styles.avatar} ${styles[size]}`}>
      {src ? (
        <img src={src} alt={alt || name} className={styles.image} />
      ) : (
        <div className={styles.initials}>{getInitials(name)}</div>
      )}
      {status && <span className={`${styles.status} ${statusClass}`} />}
    </div>
  );
}
