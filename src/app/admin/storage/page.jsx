'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout.jsx';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import styles from './page.module.css';

const COLORS = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function StoragePage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/storageAnalytics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching storage analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading storage analytics...</div>
      </AdminLayout>
    );
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>Storage Analytics</h1>

        {analytics?.total && (
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total Storage</div>
              <div className={styles.summaryValue}>
                {formatBytes(analytics.total.size * 1024 * 1024)}
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total Files</div>
              <div className={styles.summaryValue}>{analytics.total.files}</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total Downloads</div>
              <div className={styles.summaryValue}>{analytics.total.downloads}</div>
            </div>
          </div>
        )}

        <div className={styles.charts}>
          {analytics?.byFileType && analytics.byFileType.length > 0 && (
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Storage by File Type</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.byFileType}
                    dataKey="totalSize"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {analytics.byFileType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatBytes(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {analytics?.byUser && analytics.byUser.length > 0 && (
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Top Users by Storage</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.byUser.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="userName" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatBytes(value)} />
                  <Legend />
                  <Bar dataKey="totalSize" fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {analytics?.trends && analytics.trends.length > 0 && (
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Storage Trends (Last 30 Days)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatBytes(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="totalSize" stroke="#667eea" />
                  <Line type="monotone" dataKey="fileCount" stroke="#10b981" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

