"use client";

import { useState, useEffect } from "react";
import styles from "./GifPicker.module.css";

// Sample GIFs - in production, this would use GIPHY API or similar
// For now, using placeholder GIF URLs or emoji representations
const TRENDING_GIFS = [
  { id: "1", url: "https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif", preview: "🎉" },
  { id: "2", url: "https://media.giphy.com/media/l0MYC0LajbaPoEADu/giphy.gif", preview: "😂" },
  { id: "3", url: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif", preview: "👍" },
  { id: "4", url: "https://media.giphy.com/media/3o7aD2sa0qgIRCW0Bi/giphy.gif", preview: "❤️" },
  { id: "5", url: "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif", preview: "🔥" },
  { id: "6", url: "https://media.giphy.com/media/3o7abldf0bU8DIojOw/giphy.gif", preview: "😮" },
];

const CATEGORIES = [
  { id: "trending", name: "Trending", emoji: "🔥" },
  { id: "reactions", name: "Reactions", emoji: "😊" },
  { id: "celebration", name: "Celebration", emoji: "🎉" },
  { id: "love", name: "Love", emoji: "❤️" },
];

export default function GifPicker({ onSelect, isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("trending");
  const [gifs, setGifs] = useState(TRENDING_GIFS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadGifs();
    }
  }, [isOpen, selectedCategory, searchTerm]);

  const loadGifs = async () => {
    setLoading(true);
    // In production, this would call GIPHY API
    // For now, we'll use the sample GIFs
    setTimeout(() => {
      setGifs(TRENDING_GIFS);
      setLoading(false);
    }, 300);
  };

  if (!isOpen) return null;

  const handleGifSelect = (gif) => {
    onSelect(gif.url || gif.preview);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.picker} onClick={(e) => e.stopPropagation()}>
        <div className={styles.search}>
          <input
            type="text"
            placeholder="Search GIFs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.input}
          />
        </div>
        <div className={styles.categories}>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`${styles.categoryButton} ${selectedCategory === category.id ? styles.active : ""}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className={styles.categoryEmoji}>{category.emoji}</span>
              <span className={styles.categoryName}>{category.name}</span>
            </button>
          ))}
        </div>
        {loading ? (
          <div className={styles.loading}>Loading GIFs...</div>
        ) : (
          <div className={styles.grid}>
            {gifs.map((gif) => (
              <button
                key={gif.id}
                className={styles.gifItem}
                onClick={() => handleGifSelect(gif)}
                title="Click to select"
              >
                {gif.url ? (
                  <img src={gif.url} alt="GIF" className={styles.gifImage} />
                ) : (
                  <div className={styles.gifPlaceholder}>{gif.preview}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



