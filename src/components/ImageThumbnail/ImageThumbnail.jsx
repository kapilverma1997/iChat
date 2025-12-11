"use client";

import { useState, useEffect } from "react";
import styles from "./ImageThumbnail.module.css";

export default function ImageThumbnail({ fileId, imageUrl, thumbnailUrl, alt, onClick }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    if (thumbnailUrl) {
      const img = new Image();
      img.onload = () => setLoading(false);
      img.onerror = () => {
        setError(true);
        setLoading(false);
      };
      img.src = thumbnailUrl;
    } else {
      setLoading(false);
    }
  }, [thumbnailUrl]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowFull(!showFull);
    }
  };

  if (error || !thumbnailUrl) {
    return (
      <div className={styles.thumbnail} onClick={handleClick}>
        <img src={imageUrl} alt={alt} className={styles.fullImage} />
      </div>
    );
  }

  return (
    <div className={styles.thumbnail} onClick={handleClick}>
      {loading && <div className={styles.loader}>Loading...</div>}
      {showFull ? (
        <img src={imageUrl} alt={alt} className={styles.fullImage} />
      ) : (
        <img
          src={thumbnailUrl}
          alt={alt}
          className={styles.thumbImage}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
        />
      )}
      {!showFull && (
        <div className={styles.overlay}>
          <span className={styles.expandIcon}>🔍</span>
        </div>
      )}
    </div>
  );
}

