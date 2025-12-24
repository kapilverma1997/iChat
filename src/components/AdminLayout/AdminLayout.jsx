"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "../AdminSidebar/AdminSidebar.jsx";
import AdminNavbar from "../AdminNavbar/AdminNavbar.jsx";
import styles from "./AdminLayout.module.css";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!checked) {
      checkAdminAccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminAccess = async () => {
    try {
      setChecked(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // Use dedicated admin check endpoint
      const response = await fetch("/api/admin/check", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If not admin, redirect to dashboard
        const data = await response.json().catch(() => ({}));
        console.log("Admin check failed:", data.error || "Unauthorized");
        // Only redirect if we're actually on an admin page
        if (pathname?.startsWith("/admin")) {
          router.push("/dashboard");
        }
        return;
      }

      const data = await response.json();

      if (!data.isAdmin) {
        console.log("User is not an admin");
        // Only redirect if we're actually on an admin page
        if (pathname?.startsWith("/admin")) {
          router.push("/dashboard");
        }
        return;
      }

      // Set user data - fetch full user details if needed
      if (data.user) {
        setUser(data.user);
      } else {
        // Fallback: fetch user details
        const userResponse = await fetch("/api/user/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
        }
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      // Only redirect if we're actually on an admin page
      if (pathname?.startsWith("/admin")) {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.content}>{children}</div>
    </div>
  );

  // return (
  //   <div className={styles.layout}>
  //     <AdminSidebar />
  //     <div className={styles.main}>
  //       <AdminNavbar user={user} />
  //       <div className={styles.content}>{children}</div>
  //     </div>
  //   </div>
  // );
}
