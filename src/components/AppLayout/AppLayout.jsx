"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "../AppSidebar/AppSidebar.jsx";
import { ToastProvider } from "../../contexts/ToastContext";
import ToastContainer from "../ToastContainer/ToastContainer";
import styles from "./AppLayout.module.css";

export default function AppLayout({ children }) {
  const pathname = usePathname();
  // Don't show sidebar on auth pages, landing page, or public pages
  const publicPages = ["/", "/security", "/about", "/blog", "/help", "/status"];
  const hideSidebar = 
    pathname.startsWith("/auth") || 
    publicPages.includes(pathname);

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

