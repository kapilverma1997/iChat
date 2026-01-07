"use client";

import { useState, useEffect } from "react";
import styles from "./FilePreview.module.css";

export default function FilePreview({
  fileUrl,
  fileName,
  fileSize,
  type,
  onRemove,
  isOwn = false,
}) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (showImageModal) {
      document.body.style.overflow = "hidden";
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          setShowImageModal(false);
        }
      };
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [showImageModal]);

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
      <>
        <div className={`${styles.imagePreview} ${isOwn ? styles.ownMessage : ''}`}>
          {loading && <div className={styles.loading}>Loading...</div>}
          <img
            src={fileUrl}
            alt={fileName || "Preview"}
            onError={handleImageError}
            onLoad={handleImageLoad}
            className={styles.image}
            onClick={(e) => {
              e.stopPropagation();
              setShowImageModal(true);
            }}
            style={{ cursor: "pointer" }}
          />
          {onRemove && (
            <button className={styles.removeButton} onClick={onRemove}>
              ×
            </button>
          )}
        </div>
        {showImageModal && (
          <div
            className={styles.imageModalOverlay}
            onClick={() => setShowImageModal(false)}
          >
            <div
              className={styles.imageModalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.imageModalClose}
                onClick={() => setShowImageModal(false)}
                aria-label="Close"
              >
                ×
              </button>
              <img
                src={fileUrl}
                alt={fileName || "Preview"}
                className={styles.fullSizeImage}
              />
              {fileName && (
                <div className={styles.imageModalFileName}>{fileName}</div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  if (type === "video" && fileUrl) {
    return (
      <div className={`${styles.videoPreview} ${isOwn ? styles.ownMessage : ''}`}>
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

  const handleFileClick = (e) => {
    // Don't open file if clicking remove button
    if (e.target.closest(`.${styles.removeButton}`)) {
      return;
    }
    
    if (fileUrl) {
      // Open file in new tab for viewing (PDFs, documents, etc.)
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className={`${styles.filePreview} ${isOwn ? styles.ownMessage : ''}`}
      onClick={handleFileClick}
      style={{ cursor: fileUrl ? 'pointer' : 'default' }}
    >
      <div className={styles.fileIcon}>{getFileIcon()}</div>
      <div className={styles.fileInfo}>
        <div className={styles.fileName}>{fileName || "File"}</div>
        {fileSize && (
          <div className={styles.fileSize}>{formatFileSize(fileSize)}</div>
        )}
      </div>
      {onRemove && (
        <button 
          className={styles.removeButton} 
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
