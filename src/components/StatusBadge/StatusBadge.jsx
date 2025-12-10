import React from "react";
import styles from "./StatusBadge.module.css";

const statusLabels = {
  online: "Online",
  offline: "Offline",
  away: "Away",
  "do-not-disturb": "Do Not Disturb",
};

export default function StatusBadge({
  status,
  size = "medium",
  showLabel = false,
  className = "",
}) {
  return (
    <div className={`${styles.statusBadge} ${className}`}>
      <span
        className={`${styles.dot} ${styles[status]} ${styles[size]}`}
      ></span>
      {showLabel && (
        <span className={styles.label}>{statusLabels[status]}</span>
      )}
    </div>
  );
}
