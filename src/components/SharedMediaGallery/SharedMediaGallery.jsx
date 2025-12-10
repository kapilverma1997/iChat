"use client";

import { useState, useEffect } from "react";
import Modal from "../Modal/Modal.jsx";
import styles from "./SharedMediaGallery.module.css";

export default function SharedMediaGallery({ isOpen, onClose, groupId }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'image', 'video', 'file'

  useEffect(() => {
    if (isOpen && groupId) {
      loadMedia();
    }
  }, [isOpen, groupId, filter]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/groups/media?groupId=${groupId}&type=${filter}`
      , {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMedia(data.media || []);
      }
    } catch (error) {
      console.error("Error loading media:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Shared Media">
      <div className={styles.container}>
        <div className={styles.filters}>
          <button
            className={`${styles.filter} ${filter === "all" ? styles.active : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`${styles.filter} ${filter === "image" ? styles.active : ""}`}
            onClick={() => setFilter("image")}
          >
            Images
          </button>
          <button
            className={`${styles.filter} ${filter === "video" ? styles.active : ""}`}
            onClick={() => setFilter("video")}
          >
            Videos
          </button>
          <button
            className={`${styles.filter} ${filter === "file" ? styles.active : ""}`}
            onClick={() => setFilter("file")}
          >
            Files
          </button>
        </div>

        <div className={styles.gallery}>
          {loading ? (
            <div className={styles.loading}>Loading media...</div>
          ) : media.length === 0 ? (
            <div className={styles.empty}>No media shared yet</div>
          ) : (
            media.map((item) => (
              <div key={item._id} className={styles.mediaItem}>
                {item.type === "image" && (
                  <img src={item.fileUrl} alt={item.fileName} className={styles.image} />
                )}
                {item.type === "video" && (
                  <video src={item.fileUrl} className={styles.video} controls />
                )}
                {item.type === "file" && (
                  <div className={styles.file}>
                    <div className={styles.fileIcon}>📎</div>
                    <div className={styles.fileName}>{item.fileName}</div>
                  </div>
                )}
                <div className={styles.mediaInfo}>
                  <div className={styles.sender}>{item.senderId?.name}</div>
                  <div className={styles.date}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

