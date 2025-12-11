"use client";

import { useState, useEffect } from "react";
import { useSocket } from "../../hooks/useSocket.js";
import styles from "./ThemeSwitcher.module.css";

const themes = [
  { id: "light", name: "Light", preview: "#ffffff" },
  { id: "dark", name: "Dark", preview: "#1a1a1a" },
  { id: "blue", name: "Blue", preview: "#007bff" },
  { id: "green", name: "Green", preview: "#28a745" },
  { id: "high-contrast", name: "High Contrast", preview: "#000000" },
];

export default function ThemeSwitcher({ currentTheme, onThemeChange }) {
  const [previewTheme, setPreviewTheme] = useState(null);
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected) return;

    const handleThemeChange = (data) => {
      if (data.theme && onThemeChange) {
        onThemeChange(data.theme);
      }
    };

    socket.on("theme:changed", handleThemeChange);

    return () => {
      socket.off("theme:changed", handleThemeChange);
    };
  }, [socket, connected, onThemeChange]);

  const handleApplyTheme = async (themeId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/settings/theme", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ theme: themeId }),
      });

      if (response.ok && onThemeChange) {
        onThemeChange(themeId);
      }
    } catch (error) {
      console.error("Error applying theme:", error);
    }
  };

  const handlePreview = (themeId) => {
    setPreviewTheme(themeId);
    // Apply preview theme to document root
    document.documentElement.setAttribute("data-theme", themeId);
  };

  const handleCancelPreview = () => {
    setPreviewTheme(null);
    document.documentElement.setAttribute("data-theme", currentTheme);
  };

  return (
    <div className={styles.themeSwitcher}>
      <h3>Choose Theme</h3>
      <div className={styles.themes}>
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`${styles.themeOption} ${
              currentTheme === theme.id ? styles.active : ""
            }`}
          >
            <div
              className={styles.themePreview}
              style={{ backgroundColor: theme.preview }}
              onClick={() => handlePreview(theme.id)}
            />
            <div className={styles.themeInfo}>
              <span className={styles.themeName}>{theme.name}</span>
              {previewTheme === theme.id && (
                <div className={styles.previewActions}>
                  <button
                    onClick={() => {
                      handleApplyTheme(theme.id);
                      setPreviewTheme(null);
                    }}
                    className={styles.applyButton}
                  >
                    Apply
                  </button>
                  <button
                    onClick={handleCancelPreview}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

