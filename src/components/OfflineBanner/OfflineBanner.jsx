"use client";

import { useState, useEffect } from "react";
import RetryConnectionButton from "../RetryConnectionButton/RetryConnectionButton.jsx";
import styles from "./OfflineBanner.module.css";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [queuedMessages, setQueuedMessages] = useState(0);

  useEffect(() => {
    // Listen to online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    // Fetch queued messages count
    fetchQueuedMessages();

    // Poll for queued messages
    const interval = setInterval(fetchQueuedMessages, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const fetchQueuedMessages = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/messages/offlineQueue?status=pending", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setQueuedMessages(data.messages?.length || 0);
      }
    } catch (error) {
      // Silently fail if offline
    }
  };

  if (isOnline && queuedMessages === 0) {
    return null;
  }

  return (
    <div className={`${styles.banner} ${!isOnline ? styles.offline : styles.online}`}>
      <div className={styles.content}>
        {!isOnline ? (
          <>
            <span className={styles.icon}>⚠️</span>
            <span className={styles.text}>
              You're offline. Messages will be sent when you reconnect.
            </span>
          </>
        ) : (
          <>
            <span className={styles.icon}>📤</span>
            <span className={styles.text}>
              {queuedMessages} message{queuedMessages !== 1 ? "s" : ""} queued. Sending...
            </span>
          </>
        )}
      </div>
      {!isOnline && <RetryConnectionButton />}
    </div>
  );
}

