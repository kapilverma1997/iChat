'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout.jsx';
import InputBox from '../../../components/InputBox/InputBox.jsx';
import Button from '../../../components/Button/Button.jsx';
import styles from './page.module.css';

export default function ArchiveSettingsPage() {
  const [settings, setSettings] = useState({ autoArchiveDays: 30 });
  const [archivedChats, setArchivedChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch settings
      const settingsResponse = await fetch('/api/admin/archive?type=settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings({ autoArchiveDays: settingsData.autoArchiveDays || 30 });
      }

      // Fetch archived chats
      const archivedResponse = await fetch('/api/admin/archive?type=archived', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (archivedResponse.ok) {
        const archivedData = await archivedResponse.json();
        setArchivedChats(archivedData.archivedChats || []);
      }
    } catch (error) {
      console.error('Error fetching archive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/archive', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          autoArchiveDays: settings.autoArchiveDays,
        }),
      });

      if (response.ok) {
        alert('Archive settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (archivedChatId) => {
    if (!confirm('Are you sure you want to restore this chat?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/archive', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          archivedChatId,
        }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error restoring chat:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>Archive Settings</h1>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Auto-Archive Configuration</h2>
          <div className={styles.form}>
            <div className={styles.field}>
              <label>Archive chats inactive for (days)</label>
              <InputBox
                type="number"
                value={settings.autoArchiveDays}
                onChange={(e) =>
                  setSettings({ ...settings, autoArchiveDays: parseInt(e.target.value) })
                }
                min="1"
                max="365"
              />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Archived Chats</h2>
          <div className={styles.archivedList}>
            {archivedChats.length === 0 ? (
              <div className={styles.empty}>No archived chats</div>
            ) : (
              archivedChats.map((archived) => (
                <div key={archived._id} className={styles.archivedItem}>
                  <div className={styles.archivedInfo}>
                    <div className={styles.archivedTitle}>
                      Chat ID: {archived.chatId?._id || archived.chatId}
                    </div>
                    <div className={styles.archivedMeta}>
                      Archived: {new Date(archived.archivedAt).toLocaleString()}
                    </div>
                    <div className={styles.archivedMeta}>
                      Last Activity: {new Date(archived.lastActivityAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    className={styles.restoreButton}
                    onClick={() => handleRestore(archived._id)}
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

