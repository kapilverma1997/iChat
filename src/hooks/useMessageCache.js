import { useState, useEffect, useCallback } from "react";

export function useMessageCache(chatId, groupId) {
  const [cachedMessages, setCachedMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadFromCache = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const params = new URLSearchParams();
      if (chatId) params.append("chatId", chatId);
      if (groupId) params.append("groupId", groupId);

      const response = await fetch(`/api/messages/cache?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCachedMessages(data.messages || []);
        return data.messages || [];
      }
    } catch (error) {
      console.error("Error loading from cache:", error);
    }
    return [];
  }, [chatId, groupId]);

  const saveToCache = useCallback(async (messages) => {
    try {
      const token = localStorage.getItem("accessToken");
      await fetch("/api/messages/cache", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages,
          chatId,
          groupId,
          storageType: "localStorage",
        }),
      });

      // Also save to localStorage for offline access
      const cacheKey = `messages_${chatId || groupId}`;
      localStorage.setItem(cacheKey, JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  }, [chatId, groupId]);

  const clearCache = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await fetch("/api/messages/cache", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const cacheKey = `messages_${chatId || groupId}`;
      localStorage.removeItem(cacheKey);
      setCachedMessages([]);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }, [chatId, groupId]);

  // Load from localStorage on mount
  useEffect(() => {
    const cacheKey = `messages_${chatId || groupId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setCachedMessages(JSON.parse(cached));
      } catch (error) {
        console.error("Error parsing cached messages:", error);
      }
    }
  }, [chatId, groupId]);

  return {
    cachedMessages,
    loadFromCache,
    saveToCache,
    clearCache,
    loading,
  };
}

