"use client";

import styles from "./ReactionPicker.module.css";

const QUICK_REACTIONS = ["❤️", "😂", "👍", "🎉", "🔥", "😮"];

export default function ReactionPicker({ onSelect, position }) {
  return (
    <div
      className={styles.picker}
      style={{
        left: position?.x || 0,
        top: position?.y ? position.y - 50 : 0,
      }}
    >
      {QUICK_REACTIONS.map((emoji, index) => (
        <button
          key={index}
          className={styles.reaction}
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
