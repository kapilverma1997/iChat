"use client";

import Avatar from "../Avatar/Avatar.jsx";
import { formatLastSeen } from "../../lib/utils.js";
import styles from "./ChatHeader.module.css";

export default function ChatHeader({ user, chat }) {
  if (!user) return null;

  const getStatusText = () => {
    if (user.presenceStatus === "online") {
      return "Online";
    }
    if (user.presenceStatus === "away") {
      return "Away";
    }
    if (user.presenceStatus === "do-not-disturb") {
      return "Do not disturb";
    }
    return formatLastSeen(user.lastSeen);
  };

  return (
    <div className={styles.header}>
      <Avatar
        src={user.profilePhoto}
        name={user.name}
        size="medium"
        status={user.presenceStatus}
      />
      <div className={styles.info}>
        <div className={styles.name}>{user.name}</div>
        <div className={styles.status}>{getStatusText()}</div>
      </div>
    </div>
  );
}
