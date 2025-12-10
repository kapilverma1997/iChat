"use client";

import { useMemo } from "react";
import styles from "./ReactionList.module.css";

export default function ReactionList({
  reactions = [],
  currentUserId,
  onReactionClick,
}) {
  const groupedReactions = useMemo(() => {
    const groups = {};
    reactions.forEach((reaction) => {
      const key = reaction.emoji;
      if (!groups[key]) {
        groups[key] = {
          emoji: reaction.emoji,
          users: [],
          count: 0,
        };
      }
      groups[key].users.push(reaction.userId);
      groups[key].count += 1;
    });

    return Object.values(groups).map((group) => ({
      ...group,
      hasCurrentUser: group.users.some(
        (userId) => userId?.toString() === currentUserId?.toString()
      ),
    }));
  }, [reactions, currentUserId]);

  if (groupedReactions.length === 0) return null;

  return (
    <div className={styles.reactionList}>
      {groupedReactions.map((reaction, index) => (
        <button
          key={index}
          className={`${styles.reaction} ${
            reaction.hasCurrentUser ? styles.active : ""
          }`}
          onClick={() => onReactionClick?.(reaction.emoji)}
          title={`${reaction.count} ${
            reaction.count === 1 ? "reaction" : "reactions"
          }`}
        >
          <span className={styles.emoji}>{reaction.emoji}</span>
          <span className={styles.count}>{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}
