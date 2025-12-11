"use client";

import { useState, useEffect } from "react";
import styles from "./VideoThumbnail.module.css";

export default function VideoThumbnail({ fileId, videoUrl, thumbnailUrl, alt, onClick }) {
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
        <video src={videoUrl} controls className={styles.fullVideo} />
      </div>
    );
  }

  return (
    <div className={styles.thumbnail} onClick={handleClick}>
      {loading && <div className={styles.loader}>Loading...</div>}
      {showFull ? (
        <video src={videoUrl} controls className={styles.fullVideo} />
      ) : (
        <>
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
          <div className={styles.playButton}>
            <span className={styles.playIcon}>▶</span>
          </div>
        </>
      )}
    </div>
  );
}

