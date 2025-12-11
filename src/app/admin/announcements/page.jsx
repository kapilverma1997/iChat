'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../../components/AdminLayout/AdminLayout.jsx';
import Button from '../../../components/Button/Button.jsx';
import styles from './page.module.css';

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/announcements', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Announcements</h1>
          <Button onClick={() => router.push('/admin/announcements/new')}>
            + Create Announcement
          </Button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading announcements...</div>
        ) : (
          <div className={styles.list}>
            {announcements.map((announcement) => (
              <div key={announcement._id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{announcement.title}</h3>
                  <span className={`${styles.badge} ${styles[announcement.type]}`}>
                    {announcement.type}
                  </span>
                </div>
                <p className={styles.cardContent}>{announcement.content}</p>
                <div className={styles.cardMeta}>
                  <span>Target: {announcement.targetAudience}</span>
                  <span>
                    {announcement.isPublished
                      ? `Published: ${new Date(announcement.publishedAt).toLocaleString()}`
                      : `Scheduled: ${new Date(announcement.scheduledAt).toLocaleString()}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

