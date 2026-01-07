"use client";

import { useEffect, useState } from "react";
import Button from "../../../components/Button/Button.jsx";
import InputBox from "../../../components/InputBox/InputBox.jsx";
import styles from "./page.module.css";

export default function ChatPreferencesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Chat preferences
  const [chatSettings, setChatSettings] = useState({
    readReceipts: true,
    typingIndicators: true,
    linkPreviews: true,
    spellCheck: true,
    showOnlineStatus: true,
    showLastSeen: true,
    enterToSend: true,
    markAsReadOnReply: true,
    showMessageTimestamps: true,
    compactMode: false,
    showAvatars: true,
    showReactions: true,
    allowEmojis: true,
    allowStickers: true,
    allowGifs: true,
  });

  // Media settings
  const [mediaSettings, setMediaSettings] = useState({
    autoDownloadMedia: true,
    autoDownloadSizeLimit: 10, // MB
    imageQuality: "high",
    videoQuality: "high",
    compressImages: false,
  });

  // Message history settings
  const [messageHistorySettings, setMessageHistorySettings] = useState({
    autoDeleteEnabled: false,
    autoDeleteDays: 30,
    backupEnabled: false,
    archiveOldChats: false,
    archiveAfterDays: 90,
  });

  // Font and display settings
  const [displaySettings, setDisplaySettings] = useState({
    fontSize: "medium",
    messageDensity: "comfortable",
    theme: "default",
  });

  const imageQualityOptions = [
    { value: "low", label: "Low (Faster)" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High (Best Quality)" },
  ];

  const videoQualityOptions = [
    { value: "low", label: "Low (Faster)" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High (Best Quality)" },
  ];

  const fontSizeOptions = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
    { value: "extra-large", label: "Extra Large" },
  ];

  const messageDensityOptions = [
    { value: "compact", label: "Compact" },
    { value: "comfortable", label: "Comfortable" },
    { value: "spacious", label: "Spacious" },
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);

        // Load chat settings from user data
        if (data.user.chatSettings) {
          setChatSettings({
            readReceipts: data.user.chatSettings.readReceipts ?? true,
            typingIndicators: data.user.chatSettings.typingIndicators ?? true,
            linkPreviews: data.user.chatSettings.linkPreviews ?? true,
            spellCheck: data.user.chatSettings.spellCheck ?? true,
            showOnlineStatus: data.user.chatSettings.showOnlineStatus ?? true,
            showLastSeen: data.user.chatSettings.showLastSeen ?? true,
            enterToSend: data.user.chatSettings.enterToSend ?? true,
            markAsReadOnReply: data.user.chatSettings.markAsReadOnReply ?? true,
            showMessageTimestamps:
              data.user.chatSettings.showMessageTimestamps ?? true,
            compactMode: data.user.chatSettings.compactMode ?? false,
            showAvatars: data.user.chatSettings.showAvatars ?? true,
            showReactions: data.user.chatSettings.showReactions ?? true,
            allowEmojis: data.user.chatSettings.allowEmojis ?? true,
            allowStickers: data.user.chatSettings.allowStickers ?? true,
            allowGifs: data.user.chatSettings.allowGifs ?? true,
          });
        }

        // Load media settings
        if (data.user.mediaSettings) {
          setMediaSettings({
            autoDownloadMedia:
              data.user.mediaSettings.autoDownloadMedia ??
              data.user.chatSettings?.autoDownloadMedia ??
              true, // Fallback to chatSettings for backward compatibility
            autoDownloadSizeLimit:
              data.user.mediaSettings.autoDownloadSizeLimit || 10,
            imageQuality: data.user.mediaSettings.imageQuality || "high",
            videoQuality: data.user.mediaSettings.videoQuality || "high",
            compressImages: data.user.mediaSettings.compressImages ?? false,
          });
        } else if (data.user.chatSettings?.autoDownloadMedia !== undefined) {
          // Handle backward compatibility: if autoDownloadMedia is in chatSettings, migrate it
          setMediaSettings((prev) => ({
            ...prev,
            autoDownloadMedia: data.user.chatSettings.autoDownloadMedia ?? true,
          }));
        }

        // Load message history settings
        if (data.user.messageHistorySettings) {
          setMessageHistorySettings({
            autoDeleteEnabled:
              data.user.messageHistorySettings.autoDeleteEnabled ?? false,
            autoDeleteDays:
              data.user.messageHistorySettings.autoDeleteDays || 30,
            backupEnabled:
              data.user.messageHistorySettings.backupEnabled ?? false,
            archiveOldChats:
              data.user.messageHistorySettings.archiveOldChats ?? false,
            archiveAfterDays:
              data.user.messageHistorySettings.archiveAfterDays || 90,
          });
        }

        // Load display settings
        if (data.user.displaySettings) {
          setDisplaySettings({
            fontSize: data.user.displaySettings.fontSize || "medium",
            messageDensity:
              data.user.displaySettings.messageDensity || "comfortable",
            theme: data.user.displaySettings.theme || "default",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChatSettingChange = async (key, value) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const updatedSettings = { ...chatSettings, [key]: value };

      const response = await fetch("/api/user/update-chat-preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatSettings: updatedSettings,
        }),
      });

      if (response.ok) {
        setChatSettings(updatedSettings);
        setSuccess("Chat settings updated successfully");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update chat settings");
      }
    } catch (error) {
      setError(error.message || "Failed to update chat settings");
    } finally {
      setSaving(false);
    }
  };

  const handleMediaSettingChange = async (key, value) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const updatedSettings = { ...mediaSettings, [key]: value };

      const response = await fetch("/api/user/update-chat-preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mediaSettings: updatedSettings,
        }),
      });

      if (response.ok) {
        setMediaSettings(updatedSettings);
        setSuccess("Media settings updated successfully");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update media settings");
      }
    } catch (error) {
      setError(error.message || "Failed to update media settings");
    } finally {
      setSaving(false);
    }
  };

  const handleMessageHistoryChange = async (key, value) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const updatedSettings = { ...messageHistorySettings, [key]: value };

      const response = await fetch("/api/user/update-chat-preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageHistorySettings: updatedSettings,
        }),
      });

      if (response.ok) {
        setMessageHistorySettings(updatedSettings);
        setSuccess("Message history settings updated successfully");
      } else {
        const data = await response.json();
        throw new Error(
          data.error || "Failed to update message history settings"
        );
      }
    } catch (error) {
      setError(error.message || "Failed to update message history settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDisplaySettingChange = async (key, value) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const updatedSettings = { ...displaySettings, [key]: value };

      const response = await fetch("/api/user/update-chat-preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displaySettings: updatedSettings,
        }),
      });

      if (response.ok) {
        setDisplaySettings(updatedSettings);
        setSuccess("Display settings updated successfully");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update display settings");
      }
    } catch (error) {
      setError(error.message || "Failed to update display settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.chatPreferences}>
      <h2 className={styles.title}>Chat Preferences</h2>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {/* General Chat Settings */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>General Settings</h3>
        <p className={styles.sectionDescription}>
          Configure basic chat behavior and features
        </p>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Read Receipts</label>
            <p className={styles.description}>
              Show when your messages have been read
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSettings.readReceipts}
              onChange={(e) =>
                handleChatSettingChange("readReceipts", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Typing Indicators</label>
            <p className={styles.description}>
              Show when someone is typing a message
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSettings.typingIndicators}
              onChange={(e) =>
                handleChatSettingChange("typingIndicators", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Link Previews</label>
            <p className={styles.description}>
              Automatically generate previews for links in messages
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSettings.linkPreviews}
              onChange={(e) =>
                handleChatSettingChange("linkPreviews", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Spell Check</label>
            <p className={styles.description}>
              Enable spell checking while typing
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSettings.spellCheck}
              onChange={(e) =>
                handleChatSettingChange("spellCheck", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Enter to Send</label>
            <p className={styles.description}>
              Press Enter to send messages (Shift+Enter for new line)
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSettings.enterToSend}
              onChange={(e) =>
                handleChatSettingChange("enterToSend", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Mark as Read on Reply</label>
            <p className={styles.description}>
              Automatically mark messages as read when you reply
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSettings.markAsReadOnReply}
              onChange={(e) =>
                handleChatSettingChange("markAsReadOnReply", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Privacy</h3>
        <p className={styles.sectionDescription}>
          Control who can see your online status and activity
        </p>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Show Online Status</label>
            <p className={styles.description}>
              Let others see when you&apos;re online
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSettings.showOnlineStatus}
              onChange={(e) =>
                handleChatSettingChange("showOnlineStatus", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>

      {/* Media Settings */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Media & Files</h3>
        <p className={styles.sectionDescription}>
          Configure how media and files are handled
        </p>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Auto-download Media</label>
            <p className={styles.description}>
              Automatically download images and videos
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={mediaSettings.autoDownloadMedia}
              onChange={(e) =>
                handleMediaSettingChange("autoDownloadMedia", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        {mediaSettings.autoDownloadMedia && (
          <div className={styles.setting}>
            <div className={styles.settingInfo}>
              <label className={styles.label}>
                Auto-download Size Limit (MB)
              </label>
              <p className={styles.description}>
                Maximum file size to auto-download
              </p>
            </div>
            <div className={styles.inputWrapper}>
              <InputBox
                type="number"
                value={mediaSettings.autoDownloadSizeLimit}
                onChange={(e) =>
                  handleMediaSettingChange(
                    "autoDownloadSizeLimit",
                    parseInt(e.target.value) || 10
                  )
                }
                min="1"
                max="100"
                disabled={saving}
              />
            </div>
          </div>
        )}

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Image Quality</label>
            <p className={styles.description}>Quality for sending images</p>
          </div>
          <div className={styles.selectWrapper}>
            <select
              value={mediaSettings.imageQuality}
              onChange={(e) =>
                handleMediaSettingChange("imageQuality", e.target.value)
              }
              className={styles.select}
              disabled={saving}
            >
              {imageQualityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Video Quality</label>
            <p className={styles.description}>Quality for sending videos</p>
          </div>
          <div className={styles.selectWrapper}>
            <select
              value={mediaSettings.videoQuality}
              onChange={(e) =>
                handleMediaSettingChange("videoQuality", e.target.value)
              }
              className={styles.select}
              disabled={saving}
            >
              {videoQualityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Compress Images</label>
            <p className={styles.description}>
              Automatically compress images before sending
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={mediaSettings.compressImages}
              onChange={(e) =>
                handleMediaSettingChange("compressImages", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>

      {/* Display Settings */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Display</h3>
        <p className={styles.sectionDescription}>
          Customize how messages and chats are displayed
        </p>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Font Size</label>
            <p className={styles.description}>
              Adjust the size of text in messages
            </p>
          </div>
          <div className={styles.selectWrapper}>
            <select
              value={displaySettings.fontSize}
              onChange={(e) =>
                handleDisplaySettingChange("fontSize", e.target.value)
              }
              className={styles.select}
              disabled={saving}
            >
              {fontSizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Message Density</label>
            <p className={styles.description}>
              Control spacing between messages
            </p>
          </div>
          <div className={styles.selectWrapper}>
            <select
              value={displaySettings.messageDensity}
              onChange={(e) =>
                handleDisplaySettingChange("messageDensity", e.target.value)
              }
              className={styles.select}
              disabled={saving}
            >
              {messageDensityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Show Message Timestamps</label>
            <p className={styles.description}>Display time for each message</p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSettings.showMessageTimestamps}
              onChange={(e) =>
                handleChatSettingChange(
                  "showMessageTimestamps",
                  e.target.checked
                )
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Show Avatars</label>
            <p className={styles.description}>
              Display profile pictures in chat
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSettings.showAvatars}
              onChange={(e) =>
                handleChatSettingChange("showAvatars", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Compact Mode</label>
            <p className={styles.description}>
              Reduce spacing for a more compact view
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSettings.compactMode}
              onChange={(e) =>
                handleChatSettingChange("compactMode", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>

      {/* Emojis & Reactions */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Emojis & Reactions</h3>
        <p className={styles.sectionDescription}>
          Control emoji, sticker, and reaction features
        </p>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Show Reactions</label>
            <p className={styles.description}>
              Display emoji reactions on messages
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSettings.showReactions}
              onChange={(e) =>
                handleChatSettingChange("showReactions", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Allow Emojis</label>
            <p className={styles.description}>
              Enable emoji picker and emoji support
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSettings.allowEmojis}
              onChange={(e) =>
                handleChatSettingChange("allowEmojis", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Allow Stickers</label>
            <p className={styles.description}>
              Enable sticker picker and sticker support
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSettings.allowStickers}
              onChange={(e) =>
                handleChatSettingChange("allowStickers", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Allow GIFs</label>
            <p className={styles.description}>
              Enable GIF picker and GIF support
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSettings.allowGifs}
              onChange={(e) =>
                handleChatSettingChange("allowGifs", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>

      {/* Message History */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Message History</h3>
        <p className={styles.sectionDescription}>
          Manage message retention and backup settings
        </p>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Auto-delete Messages</label>
            <p className={styles.description}>
              Automatically delete messages after a specified period
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={messageHistorySettings.autoDeleteEnabled}
              onChange={(e) =>
                handleMessageHistoryChange(
                  "autoDeleteEnabled",
                  e.target.checked
                )
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        {messageHistorySettings.autoDeleteEnabled && (
          <div className={styles.setting}>
            <div className={styles.settingInfo}>
              <label className={styles.label}>Delete After (Days)</label>
              <p className={styles.description}>
                Messages will be deleted after this many days
              </p>
            </div>
            <div className={styles.inputWrapper}>
              <InputBox
                type="number"
                value={messageHistorySettings.autoDeleteDays}
                onChange={(e) =>
                  handleMessageHistoryChange(
                    "autoDeleteDays",
                    parseInt(e.target.value) || 30
                  )
                }
                min="1"
                max="365"
                disabled={saving}
              />
            </div>
          </div>
        )}

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Enable Backup</label>
            <p className={styles.description}>
              Automatically backup your messages
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={messageHistorySettings.backupEnabled}
              onChange={(e) =>
                handleMessageHistoryChange("backupEnabled", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Archive Old Chats</label>
            <p className={styles.description}>
              Automatically archive inactive chats
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={messageHistorySettings.archiveOldChats}
              onChange={(e) =>
                handleMessageHistoryChange("archiveOldChats", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        {messageHistorySettings.archiveOldChats && (
          <div className={styles.setting}>
            <div className={styles.settingInfo}>
              <label className={styles.label}>Archive After (Days)</label>
              <p className={styles.description}>
                Chats will be archived after this many days of inactivity
              </p>
            </div>
            <div className={styles.inputWrapper}>
              <InputBox
                type="number"
                value={messageHistorySettings.archiveAfterDays}
                onChange={(e) =>
                  handleMessageHistoryChange(
                    "archiveAfterDays",
                    parseInt(e.target.value) || 90
                  )
                }
                min="1"
                max="365"
                disabled={saving}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
