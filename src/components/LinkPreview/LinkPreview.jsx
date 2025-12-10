"use client";

import { useState, useEffect } from "react";
import styles from "./LinkPreview.module.css";

export default function LinkPreview({ url }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;

    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await fetch(
          `/api/messages/link-preview?url=${encodeURIComponent(url)}`
        );

        if (response.ok) {
          const data = await response.json();
          setPreview(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching link preview:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (loading) {
    return (
      <div className={styles.linkPreview}>
        <div className={styles.loading}>Loading preview...</div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.linkFallback}
      >
        {url}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.linkPreview}
    >
      {preview.image && (
        <div className={styles.imageContainer}>
          <img
            src={preview.image}
            alt={preview.title || "Preview"}
            className={styles.image}
          />
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.title}>{preview.title || url}</div>
        {preview.description && (
          <div className={styles.description}>{preview.description}</div>
        )}
        <div className={styles.url}>{new URL(url).hostname}</div>
      </div>
    </a>
  );
}
