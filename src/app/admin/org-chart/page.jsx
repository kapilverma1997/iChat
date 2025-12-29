"use client";

import { useState, useEffect } from "react";
import AdminLayout from "../../../components/AdminLayout/AdminLayout.jsx";
import OrgChartTree from "../../../components/OrgChartTree/OrgChartTree.jsx";
import styles from "./page.module.css";

export default function OrgChartPage() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrgData();
  }, []);

  const fetchOrgData = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      // Fetch departments
      const deptResponse = await fetch("/api/admin/departments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        setDepartments(deptData.departments || []);
      }

      // Fetch employees
      const empResponse = await fetch("/api/admin/employees", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (empResponse.ok) {
        const empData = await empResponse.json();
        setEmployees(empData.employees || []);
      }
    } catch (error) {
      console.error("Error fetching org data:", error);
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
