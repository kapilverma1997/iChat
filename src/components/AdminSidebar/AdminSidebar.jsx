'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminSidebar.module.css';

const menuItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/active-users', label: 'Active Users', icon: '🟢' },
  { path: '/admin/storage', label: 'Storage', icon: '💾' },
  { path: '/admin/message-logs', label: 'Message Logs', icon: '💬' },
  { path: '/admin/archive-settings', label: 'Archive', icon: '📦' },
  { path: '/admin/announcements', label: 'Announcements', icon: '📢' },
  { path: '/admin/broadcast', label: 'Broadcast', icon: '📡' },
  { path: '/admin/org-chart', label: 'Org Chart', icon: '🏢' },
  { path: '/admin/usage-heatmap', label: 'Usage Heatmap', icon: '🔥' },
  { path: '/admin/devices', label: 'Devices', icon: '📱' },
  { path: '/admin/audit', label: 'Audit Logs', icon: '📋' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <h2 className={styles.logo}>⚙️ Admin</h2>
        <button
          className={styles.toggleButton}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      <nav className={styles.nav}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              {!isCollapsed && <span className={styles.label}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

