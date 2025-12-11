'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout.jsx';
import OrgChartTree from '../../../components/OrgChartTree/OrgChartTree.jsx';
import styles from './page.module.css';

export default function OrgChartPage() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrgData();
  }, []);

  const fetchOrgData = async () => {
    try {
      // Fetch departments and employees
      // You'll need to create these APIs or use existing ones
      const token = localStorage.getItem('accessToken');
      
      // For now, we'll use a mock structure
      // In production, create /api/admin/departments and /api/admin/employees
      setDepartments([]);
      setEmployees([]);
    } catch (error) {
      console.error('Error fetching org data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading organization chart...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>Organization Chart</h1>
        <OrgChartTree departments={departments} employees={employees} />
      </div>
    </AdminLayout>
  );
}

