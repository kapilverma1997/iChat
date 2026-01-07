"use client";

import { useState, useEffect } from "react";
import Button from "../../../components/Button/Button.jsx";
import { getTranslation, getCurrentLanguage } from "../../../lib/translations.js";
import styles from "./page.module.css";

const SKIN_TONES = [
  { value: "default", label: "Default", emoji: "👋" },
  { value: "light", label: "Light", emoji: "👋🏻" },
  { value: "medium-light", label: "Medium-Light", emoji: "👋🏼" },
  { value: "medium", label: "Medium", emoji: "👋🏽" },
  { value: "medium-dark", label: "Medium-Dark", emoji: "👋🏾" },
  { value: "dark", label: "Dark", emoji: "👋🏿" },
];

const EMOJI_SIZES = [
  { value: "small", label: "Small", size: "16px" },
  { value: "medium", label: "Medium", size: "24px" },
  { value: "large", label: "Large", size: "32px" },
];

export default function EmojiSettingsPage() {
  const lang = getCurrentLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [settings, setSettings] = useState({
    defaultSkinTone: "default",
    emojiSize: "medium",
    showEmojiSuggestions: true,
    showRecentEmojis: true,
    emojiPickerStyle: "grid",
    animateEmojis: true,
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Load emoji settings from user preferences
        if (data.user?.emojiSettings) {
          setSettings({
            defaultSkinTone: data.user.emojiSettings.defaultSkinTone || "default",
            emojiSize: data.user.emojiSettings.emojiSize || "medium",
            showEmojiSuggestions: data.user.emojiSettings.showEmojiSuggestions !== false,
            showRecentEmojis: data.user.emojiSettings.showRecentEmojis !== false,
            emojiPickerStyle: data.user.emojiSettings.emojiPickerStyle || "grid",
            animateEmojis: data.user.emojiSettings.animateEmojis !== false,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/settings/emoji", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update emoji settings");
      }

      setSuccess("Emoji settings updated successfully");
      fetchUser();
    } catch (error) {
      setError(error.message || "Failed to update emoji settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.emojiSettings}>
      <h2 className={styles.title}>{getTranslation(lang, "emojiSettings")}</h2>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Default Skin Tone</h3>
          <p className={styles.sectionDescription}>
            Choose your preferred default skin tone for emojis that support it.
          </p>
          <div className={styles.skinToneGrid}>
            {SKIN_TONES.map((tone) => (
              <button
                key={tone.value}
                type="button"
                className={`${styles.skinToneOption} ${
                  settings.defaultSkinTone === tone.value ? styles.active : ""
                }`}
                onClick={() => handleSettingChange("defaultSkinTone", tone.value)}
              >
                <span className={styles.skinToneEmoji}>{tone.emoji}</span>
                <span className={styles.skinToneLabel}>{tone.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Emoji Size</h3>
          <p className={styles.sectionDescription}>
            Choose the default size for emojis in messages.
          </p>
          <div className={styles.sizeGrid}>
            {EMOJI_SIZES.map((size) => (
              <button
                key={size.value}
                type="button"
                className={`${styles.sizeOption} ${
                  settings.emojiSize === size.value ? styles.active : ""
                }`}
                onClick={() => handleSettingChange("emojiSize", size.value)}
              >
                <span className={styles.sizeEmoji} style={{ fontSize: size.size }}>
                  😀
                </span>
                <span className={styles.sizeLabel}>{size.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Emoji Picker</h3>
          <div className={styles.toggleGroup}>
            <div className={styles.toggleItem}>
              <div className={styles.toggleInfo}>
                <label className={styles.toggleLabel}>Show Recent Emojis</label>
                <p className={styles.toggleDescription}>
                  Display recently used emojis at the top of the picker
                </p>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={settings.showRecentEmojis}
                  onChange={(e) =>
                    handleSettingChange("showRecentEmojis", e.target.checked)
                  }
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.toggleItem}>
              <div className={styles.toggleInfo}>
                <label className={styles.toggleLabel}>Show Emoji Suggestions</label>
                <p className={styles.toggleDescription}>
                  Show emoji suggestions while typing
                </p>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={settings.showEmojiSuggestions}
                  onChange={(e) =>
                    handleSettingChange("showEmojiSuggestions", e.target.checked)
                  }
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.toggleItem}>
              <div className={styles.toggleInfo}>
                <label className={styles.toggleLabel}>Animate Emojis</label>
                <p className={styles.toggleDescription}>
                  Enable animations for emoji reactions and interactions
                </p>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={settings.animateEmojis}
                  onChange={(e) =>
                    handleSettingChange("animateEmojis", e.target.checked)
                  }
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Picker Style</h3>
          <p className={styles.sectionDescription}>
            Choose how emojis are displayed in the picker.
          </p>
          <div className={styles.styleOptions}>
            <button
              type="button"
              className={`${styles.styleOption} ${
                settings.emojiPickerStyle === "grid" ? styles.active : ""
              }`}
              onClick={() => handleSettingChange("emojiPickerStyle", "grid")}
            >
              <span className={styles.styleIcon}>⊞</span>
              <span className={styles.styleLabel}>Grid View</span>
            </button>
            <button
              type="button"
              className={`${styles.styleOption} ${
                settings.emojiPickerStyle === "list" ? styles.active : ""
              }`}
              onClick={() => handleSettingChange("emojiPickerStyle", "list")}
            >
              <span className={styles.styleIcon}>☰</span>
              <span className={styles.styleLabel}>List View</span>
            </button>
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

