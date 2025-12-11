import { useState, useEffect, useCallback } from "react";

export function useOfflineQueue() {
  const [queuedMessages, setQueuedMessages] = useState([]);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    fetchQueue();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/messages/offlineQueue?status=pending", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setQueuedMessages(data.messages || []);
      }
    } catch (error) {
      // Silently fail if offline
    }
  }, []);

  const queueMessage = useCallback(async (messageData, chatId, groupId) => {
    if (isOnline) {
      return null; // Don't queue if online
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/messages/offlineQueue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageData,
          chatId,
          groupId,
          deviceId: navigator.userAgent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQueuedMessages((prev) => [...prev, data.queuedMessage]);
        return data.queuedMessage;
      }
    } catch (error) {
      console.error("Error queueing message:", error);
    }

    return null;
  }, [isOnline]);

  const retryQueue = useCallback(async () => {
    if (!isOnline) return;

    try {
      const token = localStorage.getItem("accessToken");
      const pendingMessages = queuedMessages.filter((m) => m.status === "pending");

      for (const msg of pendingMessages) {
        await fetch(`/api/messages/offlineQueue`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            queueId: msg._id,
            action: "retry",
          }),
        });
      }

      fetchQueue();
    } catch (error) {
      console.error("Error retrying queue:", error);
    }
  }, [isOnline, queuedMessages]);

  return {
    queuedMessages,
    isOnline,
    queueMessage,
    retryQueue,
    fetchQueue,
  };
}

