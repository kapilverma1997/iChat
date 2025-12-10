"use client";

import React from "react";
import styles from "./ThemeSelector.module.css";

export default function ThemeSelector({
  currentTheme,
  onThemeChange,
  className = "",
}) {
  const themes = [
    { value: "light", label: "Light", icon: "☀️" },
    { value: "dark", label: "Dark", icon: "🌙" },
    { value: "custom", label: "Custom", icon: "🎨" },
  ];

  return (
    <div className={`${styles.themeSelector} ${className}`}>
      <label className={styles.label}>Theme</label>
      <div className={styles.themeOptions}>
        {themes.map((theme) => (
          <button
            key={theme.value}
            type="button"
            className={`${styles.themeOption} ${
              currentTheme === theme.value ? styles.active : ""
            }`}
            onClick={() => onThemeChange(theme.value)}
          >
            <span className={styles.icon}>{theme.icon}</span>
            <span className={styles.label}>{theme.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
