'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout.jsx';
import StatsCards from '../../../components/StatsCards/StatsCards.jsx';
import ActivityHeatmap from '../../../components/ActivityHeatmap/ActivityHeatmap.jsx';
import styles from './page.module.css';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading dashboard...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.dashboard}>
        <h1 className={styles.pageTitle}>Admin Dashboard</h1>
        
        <StatsCards stats={dashboardData?.stats} />

        <div className={styles.charts}>
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Login Activity (Last 7 Days)</h2>
            <ActivityHeatmap data={dashboardData?.loginActivity} />
          </div>

          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Device Usage</h2>
            <div className={styles.deviceStats}>
              {dashboardData?.deviceStats?.map((stat, index) => (
                <div key={index} className={styles.deviceItem}>
                  <span className={styles.deviceType}>{stat._id || 'Unknown'}</span>
                  <span className={styles.deviceCount}>{stat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {dashboardData?.recentAudits && dashboardData.recentAudits.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Audit Logs</h2>
            <div className={styles.auditList}>
              {dashboardData.recentAudits.map((audit, index) => (
                <div key={index} className={styles.auditItem}>
                  <div className={styles.auditAction}>{audit.action}</div>
                  <div className={styles.auditCategory}>{audit.category}</div>
                  <div className={styles.auditTime}>
                    {new Date(audit.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

