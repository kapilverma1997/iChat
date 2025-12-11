"use client";

import { useState } from "react";
import { useSocket } from "../../hooks/useSocket.js";
import styles from "./RetryConnectionButton.module.css";

export default function RetryConnectionButton() {
  const [retrying, setRetrying] = useState(false);
  const { socket, connected, reconnect } = useSocket();

  const handleRetry = async () => {
    setRetrying(true);
    
    try {
      // Try to reconnect socket
      if (reconnect) {
        reconnect();
      } else if (socket && !connected) {
        socket.connect();
      }

      // Process offline queue
      const token = localStorage.getItem("accessToken");
      await fetch("/api/messages/offlineQueue", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Wait a bit for connection
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (navigator.onLine) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error retrying connection:", error);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <button
      onClick={handleRetry}
      disabled={retrying || navigator.onLine}
      className={styles.retryButton}
    >
      {retrying ? "Retrying..." : "Retry Connection"}
    </button>
  );
}

