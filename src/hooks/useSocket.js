"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // Use current window location for socket connection to ensure it matches the server
    // This handles cases where users access the app via different URLs (localhost, IP, domain)
    const getSocketUrl = () => {
      if (typeof window !== 'undefined') {
        // Use the current origin (protocol + hostname + port) from the browser
        return window.location.origin;
      }
      // Fallback to environment variable or localhost
      return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    };

    const socketUrl = getSocketUrl();
    console.log("Connecting to socket at:", socketUrl);

    // Initialize socket connection
    const newSocket = io(socketUrl, {
      path: "/api/socket",
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setConnected(true);
      
      // Authenticate socket connection
      const token = localStorage.getItem("accessToken");
      if (token) {
        newSocket.emit("authenticate", token);
        console.log("Socket authentication sent");
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setConnected(false);
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      setConnected(true);
      // Re-authenticate after reconnection
      const token = localStorage.getItem("accessToken");
      if (token) {
        newSocket.emit("authenticate", token);
      }
    });

    newSocket.on("reconnect_attempt", (attemptNumber) => {
      console.log("Attempting to reconnect...", attemptNumber);
    });

    newSocket.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error);
    });

    newSocket.on("reconnect_failed", () => {
      console.error("Socket reconnection failed after all attempts");
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, connected };
}
