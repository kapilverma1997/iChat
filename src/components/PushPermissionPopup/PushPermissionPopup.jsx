"use client";

import { useState, useEffect } from "react";
import styles from "./PushPermissionPopup.module.css";

export default function PushPermissionPopup() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Register service worker if permission is already granted
    const initializeServiceWorker = async () => {
      if ("serviceWorker" in navigator && "Notification" in window) {
        const permission = Notification.permission;

        if (permission === "granted") {
          try {
            // Register service worker if not already registered
            const registration = await navigator.serviceWorker.register(
              "/sw.js"
            );
            console.log("✅ Service worker registered:", registration.scope);

            // Check if we have a subscription, if not, create one
            const subscription =
              await registration.pushManager.getSubscription();
            if (!subscription) {
              // Get VAPID public key and subscribe
              const keyResponse = await fetch("/api/notifications/push");
              const keyData = await keyResponse.json();

              if (keyData.publicKey) {
                const newSubscription =
                  await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(
                      keyData.publicKey
                    ),
                  });

                // Save subscription to server
                const token = localStorage.getItem("accessToken");
                if (token) {
                  await fetch("/api/notifications/push", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      subscription: newSubscription,
                    }),
                  });
                  console.log("✅ Push subscription saved");
                }
              }
            } else {
              console.log("✅ Push subscription already exists");
            }
          } catch (error) {
            console.error("❌ Error initializing service worker:", error);
          }
        }
      }
    };

    initializeServiceWorker();

    // Check if user has already granted permission or dismissed
    const dismissed = localStorage.getItem("pushPermissionDismissed");
    const hasPermission =
      "Notification" in window && Notification.permission !== "default";
    if (!dismissed && !hasPermission && "serviceWorker" in navigator) {
      setShow(true);
    }
  }, []);

  const requestPermission = async () => {
    setLoading(true);
    try {
      // Request browser permission
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        // Get VAPID public key
        console.log("permission granted");
        const keyResponse = await fetch("/api/notifications/push");
        console.log("keyResponse", keyResponse);
        const keyData = await keyResponse.json();
        console.log("keyData", keyData);

        // Register service worker
        const registration = await navigator.serviceWorker.register("/sw.js");

        console.log("registration", registration);
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
        });
        console.log("subscription", subscription);

        // Save subscription to server
        const token = localStorage.getItem("accessToken");
        console.log("token", token);
        await fetch("/api/notifications/push", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subscription,
          }),
        });

        console.log("fetch response");

        setShow(false);
        localStorage.setItem("pushPermissionDismissed", "true");
        console.log("push permission enabled");
      } else {
        alert(
          "Push notifications were blocked. You can enable them later in your browser settings."
        );
        setShow(false);
        localStorage.setItem("pushPermissionDismissed", "true");
      }
    } catch (error) {
      console.error("Error requesting push permission:", error);
      alert("Failed to enable push notifications");
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("pushPermissionDismissed", "true");
  };

  // Convert VAPID key
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (!show) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h3 className={styles.title}>Enable Push Notifications?</h3>
        <p className={styles.description}>
          Get notified about new messages, mentions, and important updates even
          when you&apos;re not on the site.
        </p>
        <div className={styles.actions}>
          <button
            className={styles.enableButton}
            onClick={requestPermission}
            disabled={loading}
          >
            {loading ? "Enabling..." : "Enable"}
          </button>
          <button
            className={styles.dismissButton}
            onClick={dismiss}
            disabled={loading}
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
