"use client";

import { useState, useEffect } from "react";
import FileSearch from "../FileSearch/FileSearch.jsx";
import FilePreview from "../FilePreview/FilePreview.jsx";
import styles from "./SharedMediaTabs.module.css";

export default function SharedMediaTabs({ chatId, groupId }) {
  const [activeTab, setActiveTab] = useState("images");
  const [files, setFiles] = useState({ images: [], videos: [], documents: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    loadSharedMedia();
  }, [chatId, groupId, activeTab]);

  const loadSharedMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (chatId) params.append("chatId", chatId);
      if (groupId) params.append("groupId", groupId);
      params.append("category", activeTab);

      const response = await fetch(`/api/files/shared?${params}`);
      const data = await response.json();

      if (data.success) {
        if (activeTab === "links") {
          setFiles((prev) => ({ ...prev, links: data.links || [] }));
        } else {
          setFiles((prev) => ({ ...prev, [activeTab]: data.files || [] }));
        }
      }
    } catch (error) {
      console.error("Error loading shared media:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Implement search filtering
  };

  const handleTypeFilter = (type) => {
    setTypeFilter(type);
    // Implement type filtering
  };

  const filteredFiles = () => {
    let items = files[activeTab] || [];
    if (searchQuery) {
      items = items.filter((item) =>
        (item.metadata?.name || item.content || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (typeFilter !== "all" && activeTab !== "links") {
      items = items.filter((item) => item.metadata?.type === typeFilter);
    }
    return items;
  };

  return (
    <div className={styles.sharedMediaTabs}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "images" ? styles.active : ""}`}
          onClick={() => setActiveTab("images")}
        >
          Images ({files.images.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "videos" ? styles.active : ""}`}
          onClick={() => setActiveTab("videos")}
        >
          Videos ({files.videos.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "documents" ? styles.active : ""}`}
          onClick={() => setActiveTab("documents")}
        >
          Documents ({files.documents.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "links" ? styles.active : ""}`}
          onClick={() => setActiveTab("links")}
        >
          Links ({files.links.length})
        </button>
      </div>
      <FileSearch onSearch={handleSearch} onTypeFilter={handleTypeFilter} />
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : filteredFiles().length === 0 ? (
          <div className={styles.empty}>No {activeTab} found</div>
        ) : (
          <div className={styles.grid}>
            {activeTab === "links" ? (
              filteredFiles().map((link) => (
                <div key={link._id} className={styles.linkItem}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.url}
                  </a>
                  <div className={styles.linkMeta}>
                    {link.senderId?.name} • {new Date(link.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              filteredFiles().map((file) => (
                <div key={file._id} className={styles.fileItem}>
                  <FilePreview
                    fileUrl={file.url}
                    fileName={file.metadata?.name}
                    fileSize={file.metadata?.size}
                    type={file.metadata?.type}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

