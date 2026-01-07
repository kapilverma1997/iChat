"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ThemeSwitcher from "../../../components/ThemeSwitcher/ThemeSwitcher.jsx";
import BackgroundPicker from "../../../components/BackgroundPicker/BackgroundPicker.jsx";
import { getTranslation, getCurrentLanguage } from "../../../lib/translations.js";
import styles from "./page.module.css";

export default function ThemesSettingsPage() {
  const lang = getCurrentLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentTheme, setCurrentTheme] = useState("light");
  const [currentBackground, setCurrentBackground] = useState("");
  const isSavingRef = useRef(false);

  useEffect(() => {
    fetchPreferences();
    // Apply theme to document on mount
    if (currentTheme) {
      document.documentElement.setAttribute("data-theme", currentTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document when it changes
    if (currentTheme) {
      document.documentElement.setAttribute("data-theme", currentTheme);
    }
  }, [currentTheme]);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("accessToken");

      // Fetch theme preferences
      const themeResponse = await fetch("/api/settings/theme", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (themeResponse.ok) {
        const themeData = await themeResponse.json();
        const theme = themeData.preferences?.theme || "light";
        setCurrentTheme(theme);
        document.documentElement.setAttribute("data-theme", theme);
      }

      // Fetch background preferences
      const backgroundResponse = await fetch("/api/settings/background", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (backgroundResponse.ok) {
        const backgroundData = await backgroundResponse.json();
        setCurrentBackground(backgroundData.defaultBackground || "");
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
      setError("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleThemeChange = useCallback(async (theme) => {
    // Prevent duplicate API calls if already saving
    if (isSavingRef.current) return;
    
    // Don't make API call if theme hasn't changed
    if (currentTheme === theme) return;
    
    try {
      isSavingRef.current = true;
      setSaving(true);
      setError("");
      setSuccess("");
      setCurrentTheme(theme);
      document.documentElement.setAttribute("data-theme", theme);
      
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/settings/theme", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ theme }),
      });

      if (response.ok) {
        setSuccess("Theme updated successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update theme");
      }
    } catch (error) {
      console.error("Error updating theme:", error);
      setError(error.message || "Failed to update theme");
      // Revert theme on error
      await fetchPreferences();
    } finally {
      isSavingRef.current = false;
      setSaving(false);
    }
  }, [currentTheme, fetchPreferences]);

  const handleBackgroundChange = async (url) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setCurrentBackground(url);
      
      setSuccess("Background updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating background:", error);
      setError(error.message || "Failed to update background");
      // Revert background on error
      await fetchPreferences();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.themesSettings}>
      <h2 className={styles.title}>{getTranslation(lang, "themesCustomization")}</h2>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{getTranslation(lang, "chooseTheme")}</h3>
        <ThemeSwitcher
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{getTranslation(lang, "chatBackground")}</h3>
        <BackgroundPicker
          currentBackground={currentBackground}
          onBackgroundChange={handleBackgroundChange}
        />
      </div>
    </div>
  );
}

