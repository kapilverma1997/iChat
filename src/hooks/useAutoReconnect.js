import { useEffect, useRef } from "react";
import { useSocket } from "./useSocket.js";

export function useAutoReconnect(maxRetries = 5, baseDelay = 1000) {
  const { socket, connected } = useSocket();
  const retryCountRef = useRef(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleDisconnect = () => {
      if (retryCountRef.current < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCountRef.current);
        retryCountRef.current += 1;

        timeoutRef.current = setTimeout(() => {
          console.log(`Attempting to reconnect (${retryCountRef.current}/${maxRetries})...`);
          socket.connect();
        }, delay);
      } else {
        console.error("Max reconnection attempts reached");
      }
    };

    const handleConnect = () => {
      retryCountRef.current = 0;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Emit reconnect event
      socket.emit("socket:reconnect", {
        userId: localStorage.getItem("userId"),
      });
    };

    socket.on("disconnect", handleDisconnect);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("disconnect", handleDisconnect);
      socket.off("connect", handleConnect);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [socket, maxRetries, baseDelay]);

  return { retryCount: retryCountRef.current };
}

