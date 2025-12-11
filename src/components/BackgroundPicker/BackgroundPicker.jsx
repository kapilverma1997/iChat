"use client";

import { useState } from "react";
import styles from "./BackgroundPicker.module.css";

const predefinedBackgrounds = [
  { id: "default", url: "", name: "Default" },
  { id: "gradient1", url: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", name: "Purple Gradient" },
  { id: "gradient2", url: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", name: "Pink Gradient" },
  { id: "gradient3", url: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", name: "Blue Gradient" },
  { id: "pattern1", url: "url('/patterns/dots.png')", name: "Dots Pattern" },
  { id: "pattern2", url: "url('/patterns/grid.png')", name: "Grid Pattern" },
];

export default function BackgroundPicker({ chatId, groupId, currentBackground, onBackgroundChange }) {
  const [selectedBackground, setSelectedBackground] = useState(currentBackground);

  const handleSelectBackground = async (background) => {
    setSelectedBackground(background.url);
    
    try {
      const token = localStorage.getItem("accessToken");
      await fetch("/api/settings/background", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          backgroundUrl: background.url,
          chatId: chatId || null,
          groupId: groupId || null,
          backgroundType: background.url.startsWith("url(") ? "predefined" : "uploaded",
          isDefault: !chatId && !groupId,
        }),
      });

      if (onBackgroundChange) {
        onBackgroundChange(background.url);
      }
    } catch (error) {
      console.error("Error updating background:", error);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // In a real app, upload to cloud storage
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target.result;
      handleSelectBackground({ url, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.backgroundPicker}>
      <h3>Chat Background</h3>
      
      <div className={styles.predefined}>
        <h4>Predefined</h4>
        <div className={styles.backgroundGrid}>
          {predefinedBackgrounds.map((bg) => (
            <div
              key={bg.id}
              className={`${styles.backgroundOption} ${
                selectedBackground === bg.url ? styles.selected : ""
              }`}
              onClick={() => handleSelectBackground(bg)}
              style={{ background: bg.url || "#ffffff" }}
            >
              <span className={styles.backgroundName}>{bg.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.upload}>
        <h4>Upload Custom</h4>
        <label className={styles.uploadButton}>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
          Choose Image
        </label>
      </div>
    </div>
  );
}

