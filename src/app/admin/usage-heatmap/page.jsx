'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout.jsx';
import UsageHeatmap from '../../../components/UsageHeatmap/UsageHeatmap.jsx';
import styles from './page.module.css';

export default function UsageHeatmapPage() {
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchHeatmapData();
  }, [days]);

  const fetchHeatmapData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/usageHeatmap?days=${days}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHeatmapData(data);
      }
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Usage Heatmap</h1>
          <select
            className={styles.daysSelect}
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading heatmap data...</div>
        ) : (
          <UsageHeatmap data={heatmapData} />
        )}
      </div>
    </AdminLayout>
  );
}

