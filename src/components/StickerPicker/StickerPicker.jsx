"use client";

import { useState } from "react";
import styles from "./StickerPicker.module.css";

// Sample sticker packs - in production, these would come from an API or database
const STICKER_PACKS = [
  {
    id: "default",
    name: "Default",
    stickers: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰"],
  },
  {
    id: "animals",
    name: "Animals",
    stickers: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔"],
  },
  {
    id: "food",
    name: "Food",
    stickers: ["🍎", "🍌", "🍇", "🍊", "🍋", "🍉", "🍓", "🍑", "🍒", "🍕", "🍔", "🍟", "🌭", "🍿", "🍩", "🍪"],
  },
  {
    id: "emotions",
    name: "Emotions",
    stickers: ["❤️", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "👏"],
  },
];

export default function StickerPicker({ onSelect, isOpen, onClose }) {
  const [selectedPack, setSelectedPack] = useState(STICKER_PACKS[0].id);

  if (!isOpen) return null;

  const currentPack = STICKER_PACKS.find((pack) => pack.id === selectedPack) || STICKER_PACKS[0];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.picker} onClick={(e) => e.stopPropagation()}>
        <div className={styles.packs}>
          {STICKER_PACKS.map((pack) => (
            <button
              key={pack.id}
              className={`${styles.packButton} ${selectedPack === pack.id ? styles.active : ""}`}
              onClick={() => setSelectedPack(pack.id)}
              title={pack.name}
            >
              {pack.stickers[0]}
            </button>
          ))}
        </div>
        <div className={styles.grid}>
          {currentPack.stickers.map((sticker, index) => (
            <button
              key={index}
              className={styles.sticker}
              onClick={() => {
                onSelect(sticker);
                onClose();
              }}
            >
              {sticker}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}



