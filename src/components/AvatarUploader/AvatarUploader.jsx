"use client";

import React, { useState, useRef } from "react";
import styles from "./AvatarUploader.module.css";

export default function AvatarUploader({
  currentPhoto,
  onUpload,
  size = "medium",
  className = "",
}) {
  const [preview, setPreview] = useState(currentPhoto || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      await onUpload(file);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
      setPreview(currentPhoto || null);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`${styles.avatarUploader} ${styles[size]} ${className}`}>
      <div className={styles.avatarContainer} onClick={handleClick}>
        {preview ? (
          <img src={preview} alt="Profile" className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder}>
            <span>📷</span>
          </div>
        )}
        {uploading && (
          <div className={styles.uploadingOverlay}>
            <div className={styles.spinner}></div>
          </div>
        )}
        <div className={styles.uploadOverlay}>
          <span>Change Photo</span>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className={styles.fileInput}
        disabled={uploading}
      />
    </div>
  );
}
