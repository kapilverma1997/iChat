"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import AppSidebar from "../AppSidebar/AppSidebar.jsx";
import { ToastProvider } from "../../contexts/ToastContext";
import ToastContainer from "../ToastContainer/ToastContainer";
import styles from "./AppLayout.module.css";

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  // Don't show sidebar on auth pages, landing page, or public pages
  const publicPages = ["/", "/security", "/about", "/blog", "/help", "/status"];
  const hideSidebar = 
    pathname.startsWith("/auth") || 
    publicPages.includes(pathname);

  // Initialize theme on app load
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          // Default to light theme if not logged in
          document.documentElement.setAttribute("data-theme", "light");
          return;
        }

        const response = await fetch("/api/settings/theme", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const theme = data.preferences?.theme || "light";
          document.documentElement.setAttribute("data-theme", theme);
        } else {
          // Default to light theme on error
          document.documentElement.setAttribute("data-theme", "light");
        }
      } catch (error) {
        console.error("Error initializing theme:", error);
        // Default to light theme on error
        document.documentElement.setAttribute("data-theme", "light");
      }
    };

    initializeTheme();
  }, []);

  // Listen for messages from service worker (for notification clicks)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "NAVIGATE") {
          const { url, chatId, groupId } = event.data;
          if (url) {
            router.push(url);
          }
        }
      });
    }
  }, [router]);

  return (
    <ToastProvider>
      <div className={styles.appContainer}>
        <AppSidebar />
        <main className={`${styles.mainContent} ${hideSidebar ? styles.fullWidth : ""}`}>
          {children}
        </main>
        <ToastContainer />
      </div>
    </ToastProvider>
  );
}

