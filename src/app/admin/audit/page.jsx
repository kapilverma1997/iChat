'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout.jsx';
import styles from './page.module.css';

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    action: '',
    dateFrom: '',
    dateTo: '',
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAuditLogs();
  }, [page, filters]);

  const fetchAuditLogs = async () => {
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

      const response = await fetch(`/api/admin/audit?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>Audit Logs</h1>

        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={filters.category}
            onChange={(e) => {
              setFilters({ ...filters, category: e.target.value });
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="role_change">Role Change</option>
            <option value="user_create">User Create</option>
            <option value="user_update">User Update</option>
            <option value="user_remove">User Remove</option>
            <option value="message_delete">Message Delete</option>
            <option value="setting_update">Setting Update</option>
          </select>
          <input
            type="text"
            placeholder="Search action..."
            value={filters.action}
            onChange={(e) => {
              setFilters({ ...filters, action: e.target.value });
              setPage(1);
            }}
            className={styles.filterInput}
          />
        </div>

        {loading ? (
          <div className={styles.loading}>Loading audit logs...</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Category</th>
                  <th>Admin</th>
                  <th>Target</th>
                  <th>IP Address</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id}>
                    <td className={styles.action}>{log.action}</td>
                    <td>
                      <span className={styles.category}>{log.category}</span>
                    </td>
                    <td>{log.adminUserId?.name || 'Unknown'}</td>
                    <td>{log.targetUserId?.name || log.targetResourceType || 'N/A'}</td>
                    <td>{log.ipAddress || 'N/A'}</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
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

