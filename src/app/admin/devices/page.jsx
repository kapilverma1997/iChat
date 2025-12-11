'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout.jsx';
import styles from './page.module.css';

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    fetchDevices();
  }, [selectedUserId]);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (selectedUserId) {
        params.append('userId', selectedUserId);
      }

      const response = await fetch(`/api/admin/devices?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async (deviceId, userId, kickAll = false) => {
    if (!confirm(`Are you sure you want to kick ${kickAll ? 'all devices' : 'this device'}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/kickDevice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deviceId: kickAll ? null : deviceId,
          userId,
          kickAll,
        }),
      });

      if (response.ok) {
        fetchDevices();
      }
    } catch (error) {
      console.error('Error kicking device:', error);
    }
  };

  const handleBlock = async (deviceId, userId, action) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/devices', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deviceId,
          userId,
          action,
        }),
      });

      if (response.ok) {
        fetchDevices();
      }
    } catch (error) {
      console.error('Error updating device:', error);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>Device Management</h1>

        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Filter by User ID..."
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        {loading ? (
          <div className={styles.loading}>Loading devices...</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Device</th>
                  <th>Browser/OS</th>
                  <th>IP Address</th>
                  <th>Location</th>
                  <th>Last Used</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device._id}>
                    <td>
                      <div className={styles.userInfo}>
                        {device.userId?.profilePhoto && (
                          <img
                            src={device.userId.profilePhoto}
                            alt={device.userId.name}
                            className={styles.avatar}
                          />
                        )}
                        <div>
                          <div className={styles.userName}>{device.userId?.name || 'Unknown'}</div>
                          <div className={styles.userEmail}>{device.userId?.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{device.deviceName || device.deviceType || 'Unknown'}</div>
                      <div className={styles.deviceId}>{device.deviceId}</div>
                    </td>
                    <td>
                      {device.browser} {device.browserVersion} / {device.os} {device.osVersion}
                    </td>
                    <td>{device.ipAddress || 'N/A'}</td>
                    <td>
                      {device.location?.city && device.location?.country
                        ? `${device.location.city}, ${device.location.country}`
                        : 'Unknown'}
                    </td>
                    <td>{new Date(device.lastUsedAt).toLocaleString()}</td>
                    <td>
                      <div className={styles.statusContainer}>
                        {device.isBlocked && <span className={styles.badgeBlocked}>Blocked</span>}
                        {device.isRestricted && <span className={styles.badgeRestricted}>Restricted</span>}
                        {device.isTrusted && <span className={styles.badgeTrusted}>Trusted</span>}
                        {!device.isBlocked && !device.isRestricted && !device.isTrusted && (
                          <span className={styles.badgeNormal}>Normal</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleKick(device.deviceId, device.userId._id)}
                        >
                          Kick
                        </button>
                        <button
                          className={styles.actionButton}
                          onClick={() =>
                            handleBlock(
                              device.deviceId,
                              device.userId._id,
                              device.isBlocked ? 'unblock' : 'block'
                            )
                          }
                        >
                          {device.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </div>
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

