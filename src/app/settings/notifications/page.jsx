"use client";

import { useEffect, useState } from "react";
import Button from "../../../components/Button/Button.jsx";
import InputBox from "../../../components/InputBox/InputBox.jsx";
import styles from "./page.module.css";

export default function NotificationsSettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    desktopNotifications: true,
    emailNotifications: false,
    soundEnabled: true,
    notificationPreview: true,
    showNotificationBadge: true,
    groupNotifications: true,
    directMessageNotifications: true,
    mentionNotifications: true,
    reactionNotifications: false,
  });

  // Quiet hours
  const [quietHours, setQuietHours] = useState({
    enabled: false,
    startTime: "22:00",
    endTime: "08:00",
  });

  // Notification sound
  const [notificationSound, setNotificationSound] = useState("default");

  const soundOptions = [
    { value: "default", label: "Default" },
    { value: "chime", label: "Chime" },
    { value: "ding", label: "Ding" },
    { value: "pop", label: "Pop" },
    { value: "none", label: "None" },
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

        // Load notification settings from user data
        if (data.user.notificationSettings) {
          setNotificationSettings({
            pushNotifications:
              data.user.notificationSettings.pushNotifications ?? true,
            desktopNotifications:
              data.user.notificationSettings.desktopNotifications ?? true,
            emailNotifications:
              data.user.notificationSettings.emailNotifications ?? false,
            soundEnabled: data.user.notificationSettings.soundEnabled ?? true,
            notificationPreview:
              data.user.notificationSettings.notificationPreview ?? true,
            showNotificationBadge:
              data.user.notificationSettings.showNotificationBadge ?? true,
            groupNotifications:
              data.user.notificationSettings.groupNotifications ?? true,
            directMessageNotifications:
              data.user.notificationSettings.directMessageNotifications ?? true,
            mentionNotifications:
              data.user.notificationSettings.mentionNotifications ?? true,
            reactionNotifications:
              data.user.notificationSettings.reactionNotifications ?? false,
          });
        }

        // Load quiet hours
        if (data.user.quietHours) {
          setQuietHours({
            enabled: data.user.quietHours.enabled ?? false,
            startTime: data.user.quietHours.startTime || "22:00",
            endTime: data.user.quietHours.endTime || "08:00",
          });
        }

        // Load notification sound
        setNotificationSound(data.user.notificationSound || "default");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (key, value) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const updatedSettings = { ...notificationSettings, [key]: value };

      const response = await fetch("/api/user/update-notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notificationSettings: updatedSettings,
        }),
      });

      if (response.ok) {
        setNotificationSettings(updatedSettings);
        setSuccess("Notification settings updated successfully");
      } else {
        let errorMessage = "Failed to update notification settings";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      setError(error.message || "Failed to update notification settings");
    } finally {
      setSaving(false);
    }
  };

  const handleQuietHoursChange = async (key, value) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const updatedQuietHours = { ...quietHours, [key]: value };

      const response = await fetch("/api/user/update-notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quietHours: updatedQuietHours,
        }),
      });

      if (response.ok) {
        setQuietHours(updatedQuietHours);
        setSuccess("Quiet hours updated successfully");
      } else {
        let errorMessage = "Failed to update quiet hours";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      setError(error.message || "Failed to update quiet hours");
    } finally {
      setSaving(false);
    }
  };

  const handleSoundChange = async (sound) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/update-notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notificationSound: sound,
        }),
      });

      if (response.ok) {
        setNotificationSound(sound);
        setSuccess("Notification sound updated successfully");
      } else {
        let errorMessage = "Failed to update notification sound";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      setError(error.message || "Failed to update notification sound");
    } finally {
      setSaving(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setSuccess("Notification permission granted");
        handleNotificationChange("desktopNotifications", true);
      } else {
        setError("Notification permission denied");
      }
    } else {
      setError("Browser does not support notifications");
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.notificationsSettings}>
      <h2 className={styles.title}>Notifications</h2>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {/* General Notification Settings */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>General Settings</h3>
        <p className={styles.sectionDescription}>
          Control how you receive notifications
        </p>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Push Notifications</label>
            <p className={styles.description}>
              Receive push notifications on your device
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={notificationSettings.pushNotifications}
              onChange={(e) =>
                handleNotificationChange("pushNotifications", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        {/* <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Desktop Notifications</label>
            <p className={styles.description}>
              Show desktop notifications when you receive messages
            </p>
          </div>
          <div className={styles.settingActions}>
            {!notificationSettings.desktopNotifications && (
              <Button
                variant="secondary"
                size="small"
                onClick={requestNotificationPermission}
                disabled={saving}
              >
                Enable
              </Button>
            )}
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={notificationSettings.desktopNotifications}
                onChange={(e) =>
                  handleNotificationChange(
                    "desktopNotifications",
                    e.target.checked
                  )
                }
                disabled={saving}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div> */}

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Email Notifications</label>
            <p className={styles.description}>
              Receive email notifications for important updates
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={notificationSettings.emailNotifications}
              onChange={(e) =>
                handleNotificationChange("emailNotifications", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Sound</label>
            <p className={styles.description}>
              Play sound when receiving notifications
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={notificationSettings.soundEnabled}
              onChange={(e) =>
                handleNotificationChange("soundEnabled", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Notification Preview</label>
            <p className={styles.description}>
              Show message preview in notifications
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={notificationSettings.notificationPreview}
              onChange={(e) =>
                handleNotificationChange(
                  "notificationPreview",
                  e.target.checked
                )
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        {/* <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Notification Badge</label>
            <p className={styles.description}>
              Show unread message count badge
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={notificationSettings.showNotificationBadge}
              onChange={(e) =>
                handleNotificationChange(
                  "showNotificationBadge",
                  e.target.checked
                )
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div> */}
      </div>

      {/* Notification Types */}
      {/* <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Notification Types</h3>
        <p className={styles.sectionDescription}>
          Choose which types of notifications you want to receive
        </p>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Direct Messages</label>
            <p className={styles.description}>
              Notifications for direct messages
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={notificationSettings.directMessageNotifications}
              onChange={(e) =>
                handleNotificationChange(
                  "directMessageNotifications",
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
            <label className={styles.label}>Group Messages</label>
            <p className={styles.description}>
              Notifications for group messages
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={notificationSettings.groupNotifications}
              onChange={(e) =>
                handleNotificationChange("groupNotifications", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Mentions</label>
            <p className={styles.description}>
              Notifications when you&apos;re mentioned in a message
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={notificationSettings.mentionNotifications}
              onChange={(e) =>
                handleNotificationChange(
                  "mentionNotifications",
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
            <label className={styles.label}>Reactions</label>
            <p className={styles.description}>
              Notifications when someone reacts to your messages
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={notificationSettings.reactionNotifications}
              onChange={(e) =>
                handleNotificationChange(
                  "reactionNotifications",
                  e.target.checked
                )
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div> */}

      {/* Quiet Hours */}
      {/* <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Quiet Hours</h3>
        <p className={styles.sectionDescription}>
          Automatically silence notifications during specified hours
        </p>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Enable Quiet Hours</label>
            <p className={styles.description}>
              Silence notifications during quiet hours
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={quietHours.enabled}
              onChange={(e) =>
                handleQuietHoursChange("enabled", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.quietHoursControls}>
          <div className={styles.timeInput}>
            <label className={styles.timeLabel}>Start Time</label>
            <input
              type="time"
              value={quietHours.startTime}
              onChange={(e) =>
                handleQuietHoursChange("startTime", e.target.value)
              }
              className={styles.timePicker}
              disabled={saving || !quietHours.enabled}
            />
          </div>
          <div className={styles.timeInput}>
            <label className={styles.timeLabel}>End Time</label>
            <input
              type="time"
              value={quietHours.endTime}
              onChange={(e) =>
                handleQuietHoursChange("endTime", e.target.value)
              }
              className={styles.timePicker}
              disabled={saving || !quietHours.enabled}
            />
          </div>
        </div>
      </div> */}

      {/* Notification Sound */}
      {/* <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Notification Sound</h3>
        <p className={styles.sectionDescription}>
          Choose the sound for notifications
        </p>

        <div className={styles.soundOptions}>
          {soundOptions.map((sound) => (
            <label key={sound.value} className={styles.soundOption}>
              <input
                type="radio"
                name="notificationSound"
                value={sound.value}
                checked={notificationSound === sound.value}
                onChange={(e) => handleSoundChange(e.target.value)}
                disabled={saving || !notificationSettings.soundEnabled}
              />
              <span className={styles.soundLabel}>{sound.label}</span>
            </label>
          ))}
        </div>
      </div> */}
    </div>
  );
}
