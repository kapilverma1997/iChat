"use client";

import { useState } from "react";
import styles from "./FileSearch.module.css";

export default function FileSearch({ onSearch, onTypeFilter }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleTypeChange = (type) => {
    setTypeFilter(type);
    onTypeFilter(type);
  };

  return (
    <div className={styles.fileSearch}>
      <div className={styles.searchInput}>
        <input
          type="text"
          placeholder="Search files..."
          value={query}
          onChange={handleSearch}
        />
        <span className={styles.searchIcon}>🔍</span>
      </div>
      <div className={styles.filters}>
        <button
          className={`${styles.filterButton} ${typeFilter === "all" ? styles.active : ""}`}
          onClick={() => handleTypeChange("all")}
        >
          All
        </button>
        <button
          className={`${styles.filterButton} ${typeFilter === "image" ? styles.active : ""}`}
          onClick={() => handleTypeChange("image")}
        >
          Images
        </button>
        <button
          className={`${styles.filterButton} ${typeFilter === "video" ? styles.active : ""}`}
          onClick={() => handleTypeChange("video")}
        >
          Videos
        </button>
        <button
          className={`${styles.filterButton} ${typeFilter === "document" ? styles.active : ""}`}
          onClick={() => handleTypeChange("document")}
        >
          Documents
        </button>
        <button
          className={`${styles.filterButton} ${typeFilter === "audio" ? styles.active : ""}`}
          onClick={() => handleTypeChange("audio")}
        >
          Audio
        </button>
      </div>
    </div>
  );
}

