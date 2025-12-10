"use client";

import { useState } from "react";
import styles from "./FilePreview.module.css";

export default function FilePreview({
  fileUrl,
  fileName,
  fileSize,
  type,
  onRemove,
}) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = () => {
    const ext = fileName?.split(".").pop()?.toLowerCase() || "";
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    const videoExts = ["mp4", "webm", "ogg", "mov", "avi"];
    const audioExts = ["mp3", "wav", "ogg", "m4a", "aac"];
    const docExts = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];

    if (imageExts.includes(ext) || type === "image") return "🖼️";
    if (videoExts.includes(ext) || type === "video") return "🎥";
    if (audioExts.includes(ext) || type === "audio" || type === "voice")
      return "🎵";
    if (docExts.includes(ext)) return "📄";
    return "📎";
  };

  const handleImageError = () => {
    setError(true);
    setLoading(false);
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  if (type === "image" && fileUrl && !error) {
    return (
      <div className={styles.imagePreview}>
        {loading && <div className={styles.loading}>Loading...</div>}
        <img
          src={fileUrl}
          alt={fileName || "Preview"}
          onError={handleImageError}
          onLoad={handleImageLoad}
          className={styles.image}
        />
        {onRemove && (
          <button className={styles.removeButton} onClick={onRemove}>
            ×
          </button>
        )}
      </div>
    );
  }

  if (type === "video" && fileUrl) {
    return (
      <div className={styles.videoPreview}>
        <video src={fileUrl} controls className={styles.video}>
          Your browser does not support the video tag.
        </video>
        {onRemove && (
          <button className={styles.removeButton} onClick={onRemove}>
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.filePreview}>
      <div className={styles.fileIcon}>{getFileIcon()}</div>
      <div className={styles.fileInfo}>
        <div className={styles.fileName}>{fileName || "File"}</div>
        {fileSize && (
          <div className={styles.fileSize}>{formatFileSize(fileSize)}</div>
        )}
      </div>
      {onRemove && (
        <button className={styles.removeButton} onClick={onRemove}>
          ×
        </button>
      )}
    </div>
  );
}
