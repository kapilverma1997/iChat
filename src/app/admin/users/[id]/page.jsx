'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '../../../../components/AdminLayout/AdminLayout.jsx';
import InputBox from '../../../../components/InputBox/InputBox.jsx';
import Button from '../../../../components/Button/Button.jsx';
import styles from './page.module.css';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    phone: '',
    designation: '',
    isActive: true,
  });

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          password: '',
          role: data.user.role || 'employee',
          phone: data.user.phone || '',
          designation: data.user.designation || '',
          isActive: data.user.isActive !== false,
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        router.push('/admin/users');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update user');
      }
    } catch (error) {
      setError('Failed to update user');
      console.error('Error updating user:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading user...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>Edit User</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Name *</label>
            <InputBox
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Email *</label>
            <InputBox
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Password (leave empty to keep current)</label>
            <InputBox
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label>Role</label>
            <select
              className={styles.select}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="employee">Employee</option>
              <option value="guest">Guest</option>
              <option value="read-only">Read-Only</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Phone</label>
            <InputBox
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label>Designation</label>
            <InputBox
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span>Active</span>
            </label>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

