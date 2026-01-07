"use client";

import { useEffect, useRef } from "react";
import ToastNotification from "../ToastNotification/ToastNotification";
import { useToast } from "../../contexts/ToastContext";
import styles from "./ToastContainer.module.css";

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const audioRef = useRef(null);

  // Play sound when new toast appears
  useEffect(() => {
    if (toasts.length > 0) {
      const latestToast = toasts[toasts.length - 1];

      // Only play sound for message-related notifications
      if (latestToast && latestToast.playSound !== false) {
        playNotificationSound();
      }
    }
  }, [toasts.length]);

  const playNotificationSound = () => {
    try {
      // Try to play custom sound if available
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch((error) => {
        // Fallback to system beep if custom sound fails
        console.warn("Could not play notification sound:", error);
        // Use Web Audio API for a simple beep as fallback
        playBeepSound();
      });
    } catch (error) {
      console.warn("Error playing notification sound:", error);
      playBeepSound();
    }
  };

  const playBeepSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn("Could not play beep sound:", error);
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}
