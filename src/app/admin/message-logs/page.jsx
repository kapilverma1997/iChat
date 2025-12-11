'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout.jsx';
import styles from './page.module.css';

export default function MessageLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    senderId: '',
    dateFrom: '',
    dateTo: '',
    fileType: '',
    isFlagged: '',
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await fetch(`/api/admin/messageLogs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.messageLogs || []);
      }
    } catch (error) {
      console.error('Error fetching message logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async (logId, reason) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch('/api/admin/messageLogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageLogId: logId,
          reason,
        }),
      });
      fetchLogs();
    } catch (error) {
      console.error('Error flagging message:', error);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>Message Logs</h1>

        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search messages..."
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPage(1);
            }}
            className={styles.filterInput}
          />
          <select
            className={styles.filterSelect}
            value={filters.fileType}
            onChange={(e) => {
              setFilters({ ...filters, fileType: e.target.value });
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="file">File</option>
            <option value="audio">Audio</option>
          </select>
          <select
            className={styles.filterSelect}
            value={filters.isFlagged}
            onChange={(e) => {
              setFilters({ ...filters, isFlagged: e.target.value });
              setPage(1);
            }}
          >
            <option value="">All Messages</option>
            <option value="true">Flagged Only</option>
            <option value="false">Not Flagged</option>
          </select>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading message logs...</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Content</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>{log.senderId?.name || 'Unknown'}</td>
                    <td className={styles.contentCell}>
                      {log.content?.substring(0, 50) || log.fileName || 'N/A'}
                    </td>
                    <td>{log.type}</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>
                      {log.isFlagged ? (
                        <span className={styles.flagged}>⚠️ Flagged</span>
                      ) : (
                        <span className={styles.normal}>✓ Normal</span>
                      )}
                    </td>
                    <td>
                      {!log.isFlagged && (
                        <button
                          className={styles.flagButton}
                          onClick={() => handleFlag(log._id, 'Flagged by admin')}
                        >
                          Flag
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

