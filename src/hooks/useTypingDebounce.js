import { useRef, useCallback } from "react";
import { useSocket } from "./useSocket.js";

export function useTypingDebounce(chatId, groupId, userId, delay = 1000) {
  const { socket, connected } = useSocket();
  const timeoutRef = useRef(null);
  const lastTypingRef = useRef(null);

  const emitTyping = useCallback(() => {
    if (!socket || !connected || !userId) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Emit typing event with debounce
    timeoutRef.current = setTimeout(() => {
      if (chatId) {
        socket.emit("typing:debounced", { chatId, userId });
      } else if (groupId) {
        socket.emit("typing:debounced", { groupId, userId });
      }
      lastTypingRef.current = Date.now();
    }, delay);
  }, [socket, connected, chatId, groupId, userId, delay]);

  const stopTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (socket && connected && userId) {
      if (chatId) {
        socket.emit("stopTyping", { chatId, userId });
      } else if (groupId) {
        socket.emit("groupStopTyping", { groupId, userId });
      }
    }
  }, [socket, connected, chatId, groupId, userId]);

  return { emitTyping, stopTyping };
}

