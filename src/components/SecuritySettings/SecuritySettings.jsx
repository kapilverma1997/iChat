"use client";

import { useState, useEffect } from "react";
import styles from "./SecuritySettings.module.css";

export default function SecuritySettings({ userId }) {
  const [settings, setSettings] = useState({
    screenshotBlocking: false,
    watermarkEnabled: false,
    disableCopy: false,
    disableForward: false,
    disableDownload: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [userId]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.user?.chatSecurity) {
        setSettings(data.user.chatSecurity);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const updateSetting = async (key, value) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatSecurity: {
            ...settings,
            [key]: value,
          },
        }),
      });

      if (response.ok) {
        setSettings((prev) => ({ ...prev, [key]: value }));
      }
    } catch (error) {
      console.error("Error updating setting:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Security Settings</h2>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Chat Security</h3>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Screenshot Blocking</label>
            <p className={styles.description}>
              Attempt to detect and block screenshots (experimental)
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.screenshotBlocking}
              onChange={(e) =>
                updateSetting("screenshotBlocking", e.target.checked)
              }
              disabled={loading}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Watermark Messages</label>
            <p className={styles.description}>
              Add watermark with email, user ID, and timestamp to messages
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.watermarkEnabled}
              onChange={(e) =>
                updateSetting("watermarkEnabled", e.target.checked)
              }
              disabled={loading}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        {/* <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Disable Copy</label>
            <p className={styles.description}>
              Prevent copying message content
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.disableCopy}
              onChange={(e) => updateSetting("disableCopy", e.target.checked)}
              disabled={loading}
            />
            <span className={styles.slider}></span>
          </label>
        </div> */}

        {/* <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Disable Forward</label>
            <p className={styles.description}>Prevent forwarding messages</p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.disableForward}
              onChange={(e) =>
                updateSetting("disableForward", e.target.checked)
              }
              disabled={loading}
            />
            <span className={styles.slider}></span>
          </label>
        </div> */}

        {/* <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Disable Download</label>
            <p className={styles.description}>
              Prevent downloading media files
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.disableDownload}
              onChange={(e) =>
                updateSetting("disableDownload", e.target.checked)
              }
              disabled={loading}
            />
            <span className={styles.slider}></span>
          </label>
        </div> */}
      </div>
    </div>
  );
}
