"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "../AppSidebar/AppSidebar.jsx";
import styles from "./AppLayout.module.css";

export default function AppLayout({ children }) {
  const pathname = usePathname();
  // Don't show sidebar on auth pages, landing page, or public pages
  const publicPages = ["/", "/security", "/about", "/blog", "/help", "/status"];
  const hideSidebar = 
    pathname.startsWith("/auth") || 
    publicPages.includes(pathname);

  return (
    <div className={styles.appContainer}>
      <AppSidebar />
      <main className={`${styles.mainContent} ${hideSidebar ? styles.fullWidth : ""}`}>
        {children}
      </main>
    </div>
  );
}

