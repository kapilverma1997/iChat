"use client";

import { useState } from "react";
import styles from "./MessageActionsMenu.module.css";

export default function MessageActionsMenu({
  message,
  isOwn,
  onEdit,
  onDelete,
  onDeleteForEveryone,
  onForward,
  onQuote,
  onSetPriority,
  onAddTag,
  onRemoveTag,
  onSchedule,
  onRemind,
  onTranslate,
  position = { x: 0, y: 0 },
  onClose,
}) {
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);

  const handlePriorityClick = (priority) => {
    onSetPriority(message._id, priority);
    setShowPriorityMenu(false);
    onClose?.();
  };

  const handleTagClick = (tag) => {
    const hasTag = message.tags?.includes(tag);
    if (hasTag) {
      onRemoveTag(message._id, tag);
    } else {
      onAddTag(message._id, tag);
    }
    setShowTagMenu(false);
    onClose?.();
  };

  return (
    <div
      className={styles.menu}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: position?.useFixed ? "fixed" : "absolute",
      }}
    >
      {!isOwn && (
        <button
          className={styles.menuItem}
          onClick={() => {
            onQuote(message);
            onClose?.();
          }}
        >
          Quote
        </button>
      )}
      <button
        className={styles.menuItem}
        onClick={() => {
          onForward(message);
          onClose?.();
        }}
      >
        Forward
      </button>
      {isOwn && (
        <>
          <button
            className={styles.menuItem}
            onClick={() => {
              onEdit(message);
              onClose?.();
            }}
          >
            Edit
          </button>
          <div className={styles.divider}></div>
          <div className={styles.menuItem}>
            <span>Priority</span>
            <button
              className={styles.submenuToggle}
              onClick={() => setShowPriorityMenu(!showPriorityMenu)}
            >
              ▼
            </button>
            {showPriorityMenu && (
              <div className={styles.submenu}>
                <button
                  className={`${styles.submenuItem} ${
                    message.priority === "normal" ? styles.active : ""
                  }`}
                  onClick={() => handlePriorityClick("normal")}
                >
                  Normal
                </button>
                <button
                  className={`${styles.submenuItem} ${
                    message.priority === "important" ? styles.active : ""
                  }`}
                  onClick={() => handlePriorityClick("important")}
                >
                  Important
                </button>
                <button
                  className={`${styles.submenuItem} ${
                    message.priority === "urgent" ? styles.active : ""
                  }`}
                  onClick={() => handlePriorityClick("urgent")}
                >
                  Urgent
                </button>
              </div>
            )}
          </div>
          <div className={styles.menuItem}>
            <span>Tag</span>
            <button
              className={styles.submenuToggle}
              onClick={() => setShowTagMenu(!showTagMenu)}
            >
              ▼
            </button>
            {showTagMenu && (
              <div className={styles.submenu}>
                <button
                  className={`${styles.submenuItem} ${
                    message.tags?.includes("important") ? styles.active : ""
                  }`}
                  onClick={() => handleTagClick("important")}
                >
                  Important
                </button>
                <button
                  className={`${styles.submenuItem} ${
                    message.tags?.includes("todo") ? styles.active : ""
                  }`}
                  onClick={() => handleTagClick("todo")}
                >
                  To-Do
                </button>
                <button
                  className={`${styles.submenuItem} ${
                    message.tags?.includes("reminder") ? styles.active : ""
                  }`}
                  onClick={() => handleTagClick("reminder")}
                >
                  Reminder
                </button>
              </div>
            )}
          </div>
          <button
            className={styles.menuItem}
            onClick={() => {
              onSchedule(message);
              onClose?.();
            }}
          >
            Schedule
          </button>
          <button
            className={styles.menuItem}
            onClick={() => {
              onRemind(message);
              onClose?.();
            }}
          >
            Remind Me
          </button>
          <button
            className={styles.menuItem}
            onClick={() => {
              onTranslate(message);
              onClose?.();
            }}
          >
            Translate
          </button>
          <div className={styles.divider}></div>
          <button
            className={`${styles.menuItem} ${styles.delete}`}
            onClick={() => {
              onDelete(message, false);
              onClose?.();
            }}
          >
            Delete for Me
          </button>
          <button
            className={`${styles.menuItem} ${styles.delete}`}
            onClick={() => {
              onDeleteForEveryone(message);
              onClose?.();
            }}
          >
            Delete for Everyone
          </button>
        </>
      )}
    </div>
  );
}
