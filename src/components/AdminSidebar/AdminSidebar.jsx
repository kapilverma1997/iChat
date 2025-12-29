"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminSidebar.module.css";

import { getTranslation, getCurrentLanguage } from "../../lib/translations.js";

const getMenuItems = (lang) => [
  {
    path: "/admin/dashboard",
    label: getTranslation(lang, "Dashboard"),
    icon: "📊",
  },
  {
    path: "/admin/users",
    label: getTranslation(lang, "userManagement"),
    icon: "👥",
  },
  {
    path: "/admin/roles",
    label: getTranslation(lang, "rolesPermissions"),
    icon: "🔐",
  },
  // {
  //   path: "/admin/import-employees",
  //   label: getTranslation(lang, "importEmployees"),
  //   icon: "📥",
  // },
  {
    path: "/admin/active-users",
    label: getTranslation(lang, "activeUsers"),
    icon: "🟢",
  },
  {
    path: "/admin/storage",
    label: getTranslation(lang, "storageAnalytics"),
    icon: "💾",
  },
  // {
  //   path: "/admin/analytics/files",
  //   label: getTranslation(lang, "fileAnalytics"),
  //   icon: "📊",
  // },
  {
    path: "/admin/message-logs",
    label: getTranslation(lang, "messageLogs"),
    icon: "💬",
  },
  {
    path: "/admin/archive-settings",
    label: getTranslation(lang, "archiveSettings"),
    icon: "📦",
  },
  {
    path: "/admin/announcements",
    label: getTranslation(lang, "announcements"),
    icon: "📢",
  },
  {
    path: "/admin/broadcast",
    label: getTranslation(lang, "broadcastChannels"),
    icon: "📡",
  },
  {
    path: "/admin/org-chart",
    label: getTranslation(lang, "orgChart"),
    icon: "🏢",
  },
  {
    path: "/admin/usage-heatmap",
    label: getTranslation(lang, "usageHeatmap"),
    icon: "🔥",
  },
  {
    path: "/admin/devices",
    label: getTranslation(lang, "deviceManagement"),
    icon: "📱",
  },
  {
    path: "/admin/audit",
    label: getTranslation(lang, "auditTrails"),
    icon: "📋",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lang = getCurrentLanguage();
  const menuItems = getMenuItems(lang);

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
      <div className={styles.header}>
        {!isCollapsed && (
          <h2 className={styles.logo}>
            ⚙️ {getTranslation(lang, "adminPanel")}
          </h2>
        )}
        {isCollapsed && <h2 className={styles.logo}>⚙️</h2>}
        <button
          className={styles.toggleButton}
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>
      <nav className={styles.nav}>
        {menuItems.map((item) => {
          const isActive =
            pathname === item.path || pathname?.startsWith(item.path + "/");
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.menuItem} ${isActive ? styles.active : ""}`}
              title={isCollapsed ? item.label : ""}
            >
              <span className={styles.icon}>{item.icon}</span>
              {!isCollapsed && (
                <span className={styles.label}>{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
