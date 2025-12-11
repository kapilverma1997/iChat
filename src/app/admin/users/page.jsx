'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../../components/AdminLayout/AdminLayout.jsx';
import UserManagementTable from '../../../components/UserManagementTable/UserManagementTable.jsx';
import Button from '../../../components/Button/Button.jsx';
import styles from './page.module.css';

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>User Management</h1>
          <Button onClick={() => router.push('/admin/users/new')}>
            + Add User
          </Button>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={styles.searchInput}
          />
        </div>

        {loading ? (
          <div className={styles.loading}>Loading users...</div>
        ) : (
          <>
            <UserManagementTable users={users} onRefresh={fetchUsers} />
            {total > 50 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageButton}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {page} of {Math.ceil(total / 50)}
                </span>
                <button
                  className={styles.pageButton}
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / 50)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

