"use client";

import { useState, useEffect } from "react";
import styles from "./UserStatsCard.module.css";

export default function UserStatsCard({ userId, period = "daily" }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId, period]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/analytics/user?userId=${userId}&period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading stats...</div>;
  }

  if (!stats) {
    return <div className={styles.error}>No stats available</div>;
  }

  return (
    <div className={styles.statsCard}>
      <h3 className={styles.title}>User Statistics</h3>
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Messages Sent</div>
          <div className={styles.statValue}>{stats.totals.messagesSent}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Messages Received</div>
          <div className={styles.statValue}>{stats.totals.messagesReceived}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Avg Response Time</div>
          <div className={styles.statValue}>
            {stats.totals.averageResponseTime}s
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Engagement Score</div>
          <div className={styles.statValue}>
            {stats.totals.engagementScore}/100
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Days Active</div>
          <div className={styles.statValue}>{stats.totals.daysActive}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Chats Participated</div>
          <div className={styles.statValue}>{stats.messagesPerChat.length}</div>
        </div>
      </div>
    </div>
  );
}

