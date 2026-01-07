"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getTranslation, getCurrentLanguage } from "../../lib/translations.js";
import styles from "./DashboardSidebar.module.css";

export default function DashboardSidebar({ chats, groups, currentUserId }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const lang = getCurrentLanguage();

  useEffect(() => {
    // Detect active section from pathname
    if (pathname.startsWith("/collaboration")) {
      setActiveSection("collaboration");
    } else if (pathname.startsWith("/analytics")) {
      setActiveSection("analytics");
    } else if (pathname.startsWith("/files")) {
      setActiveSection("files");
    } else if (pathname.startsWith("/calendar")) {
      setActiveSection("calendar");
    } else {
      setActiveSection("chats");
    }
  }, [pathname]);

  const menuSections = [
    {
      id: "chats",
      label: getTranslation(lang, "chats"),
      icon: "💬",
      items: [
        {
          label: getTranslation(lang, "allChats"),
          href: "/chats",
          icon: "💬",
        },
        {
          label: getTranslation(lang, "archivedChats"),
          href: "/chats/archived",
          icon: "📦",
        },
        {
          label: getTranslation(lang, "pinnedMessages"),
          href: "/chats/pinned",
          icon: "📌",
        },
        {
          label: getTranslation(lang, "drafts"),
          href: "/chats/drafts",
          icon: "📝",
        },
      ],
    },
    {
      id: "groups",
      label: getTranslation(lang, "groups"),
      icon: "👥",
      items: [
        {
          label: getTranslation(lang, "allGroups"),
          href: "/groups",
          icon: "👥",
        },
        {
          label: getTranslation(lang, "myGroups"),
          href: "/groups/my",
          icon: "⭐",
        },
      ],
    },
    {
      id: "collaboration",
      label: getTranslation(lang, "collaboration"),
      icon: "🤝",
      items: [
        {
          label: getTranslation(lang, "collaborationCenter"),
          href: "/collaboration",
          icon: "🏠",
        },
        {
          label: getTranslation(lang, "toDoLists"),
          href: "/collaboration/todos",
          icon: "✅",
        },
        {
          label: getTranslation(lang, "notes"),
          href: "/collaboration/notes",
          icon: "📝",
        },
        {
          label: getTranslation(lang, "whiteboard"),
          href: "/collaboration/whiteboard",
          icon: "🖼️",
        },
        {
          label: getTranslation(lang, "documents"),
          href: "/collaboration/documents",
          icon: "📄",
        },
        {
          label: getTranslation(lang, "meetings"),
          href: "/collaboration/meetings",
          icon: "📅",
        },
        {
          label: getTranslation(lang, "taskAssignments"),
          href: "/collaboration/tasks",
          icon: "📋",
        },
      ],
    },
    {
      id: "media",
      label: getTranslation(lang, "media"),
      icon: "📁",
      items: [
        {
          label: getTranslation(lang, "sharedMedia"),
          href: "/files/media",
          icon: "🖼️",
        },
        {
          label: getTranslation(lang, "documents"),
          href: "/files/documents",
          icon: "📄",
        },
        {
          label: getTranslation(lang, "allFiles"),
          href: "/files",
          icon: "📁",
        },
      ],
    },
    {
      id: "tools",
      label: getTranslation(lang, "tools"),
      icon: "🛠️",
      items: [
        {
          label: getTranslation(lang, "search"),
          href: "/search",
          icon: "🔍",
        },
        {
          label: getTranslation(lang, "calendar"),
          href: "/calendar",
          icon: "📅",
        },
        {
          label: getTranslation(lang, "analytics"),
          href: "/analytics",
          icon: "📊",
        },
      ],
    },
  ];

  const isActive = (href) => {
    if (href === "/chats") {
      return pathname === "/chats";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
    >
      <div className={styles.sidebarHeader}>
        <button
          className={styles.collapseButton}
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? "▶" : "◀"}
        </button>
      </div>

      <nav className={styles.nav}>
        {menuSections.map((section) => (
          <div key={section.id} className={styles.section}>
            {!isCollapsed && (
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>{section.icon}</span>
                <span className={styles.sectionLabel}>{section.label}</span>
              </div>
            )}
            <ul className={styles.sectionItems}>
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.navItem} ${
                      isActive(item.href) ? styles.active : ""
                    }`}
                    title={isCollapsed ? item.label : ""}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {!isCollapsed && (
                      <span className={styles.navLabel}>{item.label}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {!isCollapsed && (
        <div className={styles.sidebarFooter}>
          <Link href="/settings" className={styles.settingsLink}>
            <span className={styles.settingsIcon}>⚙️</span>
            <span>{getTranslation(lang, "settings")}</span>
          </Link>
        </div>
      )}
    </aside>
  );
}
