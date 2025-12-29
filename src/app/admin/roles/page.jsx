'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout.jsx';
import styles from './page.module.css';

// Permission categories for better organization
const PERMISSION_CATEGORIES = {
  'Group Management': [
    'edit_group_info',
    'create_group',
    'remove_user',
  ],
  'Message Management': [
    'delete_message',
    'send_messages',
    'view_messages',
  ],
  'File Management': [
    'upload_files',
  ],
  'Admin Functions': [
    'manage_announcements',
    'access_analytics',
    'archive_chats',
    'manage_users',
    'view_audit_logs',
  ],
  'Special': [
    'all',
  ],
};

// Human-readable permission names
const PERMISSION_NAMES = {
  'all': 'All Permissions',
  'edit_group_info': 'Edit Group Information',
  'delete_message': 'Delete Messages',
  'remove_user': 'Remove Users',
  'upload_files': 'Upload Files',
  'manage_announcements': 'Manage Announcements',
  'access_analytics': 'Access Analytics',
  'archive_chats': 'Archive Chats',
  'manage_users': 'Manage Users',
  'view_audit_logs': 'View Audit Logs',
  'create_group': 'Create Groups',
  'send_messages': 'Send Messages',
  'view_messages': 'View Messages',
};

export default function RolesPage() {
  const [roles, setRoles] = useState({});
  const [roleDistribution, setRoleDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoles, setExpandedRoles] = useState(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/roles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || {});
        setRoleDistribution(data.roleDistribution || []);
        // Expand first role by default
        if (Object.keys(data.roles || {}).length > 0) {
          setExpandedRoles(new Set([Object.keys(data.roles)[0]]));
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (roleKey) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleKey)) {
      newExpanded.delete(roleKey);
    } else {
      newExpanded.add(roleKey);
    }
    setExpandedRoles(newExpanded);
  };

  const getRoleCount = (roleKey) => {
    const distribution = roleDistribution.find((item) => item._id === roleKey);
    return distribution?.count || 0;
  };

  const getPermissionsByCategory = (permissions) => {
    const categorized = {};
    Object.keys(PERMISSION_CATEGORIES).forEach((category) => {
      categorized[category] = permissions.filter((perm) =>
        PERMISSION_CATEGORIES[category].includes(perm)
      );
    });
    return categorized;
  };

  const getTotalUsers = () => {
    return roleDistribution.reduce((sum, item) => sum + (item.count || 0), 0);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.page}>
          <div className={styles.loading}>Loading roles and permissions...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Roles & Permissions</h1>
          <p className={styles.subtitle}>
            Manage user roles and their associated permissions
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {/* Statistics Summary */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{Object.keys(roles).length}</div>
            <div className={styles.statLabel}>Total Roles</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{getTotalUsers()}</div>
            <div className={styles.statLabel}>Total Users</div>
          </div>
        </div>

        {/* Roles List */}
        <div className={styles.rolesContainer}>
          {Object.entries(roles).map(([roleKey, roleData]) => {
            const isExpanded = expandedRoles.has(roleKey);
            const userCount = getRoleCount(roleKey);
            const categorizedPermissions = getPermissionsByCategory(
              roleData.permissions || []
            );

            return (
              <div key={roleKey} className={styles.roleCard}>
                <div
                  className={styles.roleHeader}
                  onClick={() => toggleRole(roleKey)}
                >
                  <div className={styles.roleInfo}>
                    <h3 className={styles.roleName}>{roleData.name}</h3>
                    <span className={styles.roleKey}>({roleKey})</span>
                    <span className={styles.roleCount}>
                      {userCount} user{userCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className={styles.roleActions}>
                    <span className={styles.permissionCount}>
                      {roleData.permissions?.length || 0} permission
                      {(roleData.permissions?.length || 0) !== 1 ? 's' : ''}
                    </span>
                    <span className={styles.expandIcon}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.roleContent}>
                    {/* Permissions by Category */}
                    {Object.entries(categorizedPermissions).map(
                      ([category, perms]) => {
                        if (perms.length === 0) return null;
                        return (
                          <div key={category} className={styles.permissionCategory}>
                            <h4 className={styles.categoryTitle}>{category}</h4>
                            <div className={styles.permissionsList}>
                              {perms.map((perm) => (
                                <div key={perm} className={styles.permissionItem}>
                                  <span className={styles.permissionIcon}>✓</span>
                                  <span className={styles.permissionName}>
                                    {PERMISSION_NAMES[perm] || perm}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    )}

                    {/* Special case for "all" permission */}
                    {roleData.permissions?.includes('all') && (
                      <div className={styles.allPermissions}>
                        <div className={styles.allPermissionsBadge}>
                          ⭐ Full Access - All Permissions Granted
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {roleData.permissions?.length === 0 && (
                      <div className={styles.noPermissions}>
                        No permissions assigned to this role.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className={styles.infoSection}>
          <h3 className={styles.infoTitle}>About Roles & Permissions</h3>
          <div className={styles.infoContent}>
            <p>
              Roles define what actions users can perform in the system. Each
              role has a specific set of permissions that determine access
              levels and capabilities.
            </p>
            <ul className={styles.infoList}>
              <li>
                <strong>Owner:</strong> Has full access to all system features
                and settings.
              </li>
              <li>
                <strong>Admin:</strong> Can manage most system features except
                organization-level changes.
              </li>
              <li>
                <strong>Moderator:</strong> Can manage groups and messages
                within their assigned groups.
              </li>
              <li>
                <strong>Employee:</strong> Standard user with basic messaging
                and file upload capabilities.
              </li>
              <li>
                <strong>Guest:</strong> Limited access to view and send
                messages.
              </li>
              <li>
                <strong>Read-Only:</strong> Can only view messages, cannot send
                or interact.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

