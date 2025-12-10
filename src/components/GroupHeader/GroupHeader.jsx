"use client";

import { useState } from "react";
import Avatar from "../Avatar/Avatar.jsx";
import styles from "./GroupHeader.module.css";

export default function GroupHeader({ group, userRole, onSettingsClick, onMembersClick }) {
  const [showMenu, setShowMenu] = useState(false);

  const getGroupTypeBadge = () => {
    if (group.groupType === "announcement") return "📢 Announcement";
    if (group.groupType === "private") return "🔒 Private";
    return "🌐 Public";
  };

  const memberCount = group.memberCount || group.members?.length || 0;

  return (
    <div className={styles.header}>
      <Avatar
        src={group.groupPhoto}
        name={group.name}
        size="medium"
      />
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <div className={styles.name}>{group.name}</div>
          <span className={styles.typeBadge}>{getGroupTypeBadge()}</span>
        </div>
        <div className={styles.meta}>
          <span className={styles.memberCount}>{memberCount} members</span>
          {group.description && (
            <span className={styles.description}>{group.description}</span>
          )}
        </div>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.actionButton}
          onClick={onMembersClick}
          title="View Members"
        >
          👥
        </button>
        {(userRole === "owner" || userRole === "admin") && (
          <button
            className={styles.actionButton}
            onClick={onSettingsClick}
            title="Group Settings"
          >
            ⚙️
          </button>
        )}
        <button
          className={styles.actionButton}
          onClick={() => setShowMenu(!showMenu)}
          title="More Options"
        >
          ⋮
        </button>
        {showMenu && (
          <div className={styles.menu}>
            <button onClick={() => { setShowMenu(false); onMembersClick(); }}>
              View Members
            </button>
            {(userRole === "owner" || userRole === "admin") && (
              <button onClick={() => { setShowMenu(false); onSettingsClick(); }}>
                Group Settings
              </button>
            )}
            <button onClick={() => setShowMenu(false)}>
              Group Info
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

