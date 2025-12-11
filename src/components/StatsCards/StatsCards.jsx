'use client';

import styles from './StatsCards.module.css';

export default function StatsCards({ stats }) {
  const cards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: '👥',
      color: '#667eea',
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: '🟢',
      color: '#10b981',
    },
    {
      title: 'Storage Used',
      value: `${(stats?.totalStorage || 0).toFixed(2)} MB`,
      icon: '💾',
      color: '#f59e0b',
    },
    {
      title: 'Messages Today',
      value: stats?.messagesToday || 0,
      icon: '💬',
      color: '#3b82f6',
    },
    {
      title: 'Total Groups',
      value: stats?.totalGroups || 0,
      icon: '👨‍👩‍👧‍👦',
      color: '#8b5cf6',
    },
    {
      title: 'Broadcast Channels',
      value: stats?.broadcastChannels || 0,
      icon: '📡',
      color: '#ec4899',
    },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card, index) => (
        <div key={index} className={styles.card}>
          <div className={styles.icon} style={{ backgroundColor: `${card.color}20` }}>
            <span style={{ fontSize: '24px' }}>{card.icon}</span>
          </div>
          <div className={styles.content}>
            <div className={styles.value}>{card.value}</div>
            <div className={styles.title}>{card.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

