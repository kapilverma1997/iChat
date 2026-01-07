"use client";

import styles from "./MultiSelectBar.module.css";

export default function MultiSelectBar({
  selectedCount,
  onDelete,
  onClear,
}) {
  return (
    <div className={styles.multiSelectBar}>
      <div className={styles.count}>
        {selectedCount} {selectedCount === 1 ? "message" : "messages"} selected
      </div>
      <div className={styles.actions}>
        <button className={`${styles.actionButton} ${styles.delete}`} onClick={onDelete}>
          Delete
        </button>
        <button className={styles.clearButton} onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
}

