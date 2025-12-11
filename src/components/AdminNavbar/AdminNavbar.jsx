'use client';

import { useRouter } from 'next/navigation';
import styles from './AdminNavbar.module.css';

export default function AdminNavbar({ user }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('accessToken');
      router.push('/auth/login');
    }
  };

  return (
    <div className={styles.navbar}>
      <div className={styles.left}>
        <h1 className={styles.title}>Admin Panel</h1>
      </div>
      <div className={styles.right}>
        <span className={styles.userName}>{user?.name || 'Admin'}</span>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

