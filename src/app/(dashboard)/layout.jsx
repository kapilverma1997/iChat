"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import MainNavbar from "../../components/MainNavbar/MainNavbar.jsx";
import DashboardSidebar from "../../components/DashboardSidebar/DashboardSidebar.jsx";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs.jsx";
import ProtectedLayout from "../../components/ProtectedLayout/ProtectedLayout.jsx";
import styles from "./layout.module.css";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    alert("(admin)/dashboard.");
    fetchUser();
    fetchChats();
    fetchGroups();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAdmin(data.user?.role === "admin" || data.user?.role === "owner");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/chat/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/groups/list?type=all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  // Hide sidebar on admin pages
  const isAdminPage = pathname.startsWith("/admin");
  const showSidebar = !isAdminPage && !pathname.startsWith("/auth");

  return (
    <ProtectedLayout>
      <div className={styles.layout}>
        <MainNavbar user={user} isAdmin={isAdmin} />
        <div className={styles.contentWrapper}>
          {showSidebar && (
            <>
              <DashboardSidebar
                chats={chats}
                groups={groups}
                currentUserId={user?._id}
              />
              <div
                className={styles.sidebarOverlay}
                onClick={() => setSidebarOpen(false)}
              />
            </>
          )}
          <main
            className={`${styles.main} ${
              showSidebar ? styles.withSidebar : ""
            }`}
          >
            {pathname !== "/dashboard" && <Breadcrumbs />}
            {children}
          </main>
        </div>
      </div>
    </ProtectedLayout>
  );
}
