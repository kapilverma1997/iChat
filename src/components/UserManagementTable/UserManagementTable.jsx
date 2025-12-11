'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './UserManagementTable.module.css';

export default function UserManagementTable({ users, onRefresh }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState(null);

  const handleEdit = (userId) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    setDeletingId(userId);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onRefresh?.();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          newRole,
        }),
      });

      if (response.ok) {
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last Seen</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>
                <div className={styles.userInfo}>
                  {user.profilePhoto && (
                    <img
                      src={user.profilePhoto}
                      alt={user.name}
                      className={styles.avatar}
                    />
                  )}
                  <span>{user.name}</span>
                </div>
              </td>
              <td>{user.email}</td>
              <td>
                <select
                  className={styles.roleSelect}
                  value={user.role || 'employee'}
                  onChange={(e) => handleRoleChange(user._id, e.target.value)}
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="employee">Employee</option>
                  <option value="guest">Guest</option>
                  <option value="read-only">Read-Only</option>
                </select>
              </td>
              <td>
                <span
                  className={`${styles.status} ${
                    user.isActive !== false ? styles.active : styles.inactive
                  }`}
                >
                  {user.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                {user.lastSeen
                  ? new Date(user.lastSeen).toLocaleDateString()
                  : 'Never'}
              </td>
              <td>
                <div className={styles.actions}>
                  <button
                    className={styles.editButton}
                    onClick={() => handleEdit(user._id)}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(user._id)}
                    disabled={deletingId === user._id}
                  >
                    {deletingId === user._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

