'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../../../components/AdminLayout/AdminLayout.jsx';
import InputBox from '../../../../components/InputBox/InputBox.jsx';
import Button from '../../../../components/Button/Button.jsx';
import styles from './page.module.css';

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    targetAudience: 'all',
    scheduledAt: '',
    expiresAt: '',
    priority: 'normal',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/announcements');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create announcement');
      }
    } catch (error) {
      setError('Failed to create announcement');
      console.error('Error creating announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>Create Announcement</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Title *</label>
            <InputBox
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Content *</label>
            <textarea
              className={styles.textarea}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Type</label>
              <select
                className={styles.select}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="urgent">Urgent</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>Target Audience</label>
              <select
                className={styles.select}
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              >
                <option value="all">All Users</option>
                <option value="employees">Employees</option>
                <option value="managers">Managers</option>
                <option value="admins">Admins</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Scheduled At (optional)</label>
              <InputBox
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label>Expires At (optional)</label>
              <InputBox
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Priority</label>
            <select
              className={styles.select}
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Announcement'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

