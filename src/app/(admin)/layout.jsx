"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainNavbar from "../../components/MainNavbar/MainNavbar.jsx";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar.jsx";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs.jsx";
import ProtectedLayout from "../../components/ProtectedLayout/ProtectedLayout.jsx";
import { isAdmin } from "../../../lib/adminAuth.js";
import styles from "./layout.module.css";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    alert("(admin)/layout.");
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);

        // Check if user is admin or owner
        const admin =
          data.user?.role === "admin" || data.user?.role === "owner";
        setIsAdminUser(admin);

        if (!admin) {
          router.push("/dashboard");
          return;
        }
      } else {
        router.push("/auth/login");
        return;
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      router.push("/auth/login");
      return;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdminUser) {
    return null;
  }

  return (
    <ProtectedLayout>
      <div className={styles.layout}>
        <MainNavbar user={user} isAdmin={true} />
        <div className={styles.contentWrapper}>
          <AdminSidebar />
          <main className={styles.main}>
            <Breadcrumbs />
            {children}
          </main>
        </div>
      </div>
    </ProtectedLayout>
  );
}
