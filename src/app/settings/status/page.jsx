"use client";

import { useEffect, useState } from "react";
import Button from "../../../components/Button/Button.jsx";
import InputBox from "../../../components/InputBox/InputBox.jsx";
import { getTranslation, getCurrentLanguage } from "../../../lib/translations.js";
import styles from "./page.module.css";

const durationOptions = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 480, label: "8 hours" },
  { value: null, label: "Custom" },
];

export default function StatusDurationSettingsPage() {
  const lang = getCurrentLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [statusDuration, setStatusDuration] = useState(null);
  const [customDuration, setCustomDuration] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    fetchStatusDuration();
  }, []);

  const fetchStatusDuration = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/settings/statusDuration", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const duration = data.statusDuration;
        const custom = data.customStatusDuration;

        setStatusDuration(duration);
        
        // If custom duration is set, show custom input
        if (custom && !durationOptions.find((d) => d.value === duration)) {
          setShowCustomInput(true);
          setCustomDuration(custom.toString());
        } else if (duration === null && custom) {
          setShowCustomInput(true);
          setCustomDuration(custom.toString());
        } else {
          setShowCustomInput(false);
          setCustomDuration("");
        }
      }
    } catch (error) {
      console.error("Error fetching status duration:", error);
      setError("Failed to load status duration settings");
    } finally {
      setLoading(false);
    }
  };

  const handleDurationSelect = async (duration) => {
    setStatusDuration(duration);
    setError("");
    setSuccess("");

    if (duration === null) {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomDuration("");
      await saveDuration(duration, null);
    }
  };

  const handleCustomDurationSave = async () => {
    const minutes = parseInt(customDuration);
    if (isNaN(minutes) || minutes <= 0) {
      setError("Please enter a valid number of minutes (greater than 0)");
      return;
    }
    await saveDuration(null, minutes);
  };

  const saveDuration = async (duration, custom) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/settings/statusDuration", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          statusDuration: duration,
          customStatusDuration: custom,
        }),
      });

      if (response.ok) {
        setSuccess("Status duration updated successfully");
        if (custom) {
          setStatusDuration(null);
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status duration");
      }
    } catch (error) {
      setError(error.message || "Failed to update status duration");
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "Never";
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes === 60) return "1 hour";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
    return `${hours} ${hours === 1 ? "hour" : "hours"} ${mins} ${mins === 1 ? "minute" : "minutes"}`;
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.statusDurationSettings}>
      <h2 className={styles.title}>
        {getTranslation(lang, "statusDuration") || "Status Duration"}
      </h2>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Auto-Clear Status</h3>
        <p className={styles.sectionDescription}>
          Automatically clear your status message after the selected duration.
          This helps keep your status up-to-date and relevant.
        </p>

        <div className={styles.durationOptions}>
          {durationOptions.map((option) => (
            <label
              key={option.value || "custom"}
              className={styles.durationOption}
            >
              <input
                type="radio"
                name="statusDuration"
                value={option.value || "custom"}
                checked={
                  option.value === null
                    ? showCustomInput && statusDuration === null
                    : statusDuration === option.value
                }
                onChange={() => handleDurationSelect(option.value)}
                disabled={saving}
              />
              <span className={styles.durationLabel}>{option.label}</span>
            </label>
          ))}
        </div>

        {showCustomInput && (
          <div className={styles.customInputSection}>
            <div className={styles.customInput}>
              <InputBox
                label="Custom Duration (minutes)"
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="Enter minutes"
                min="1"
                disabled={saving}
              />
              <Button
                variant="primary"
                onClick={handleCustomDurationSave}
                disabled={saving || !customDuration}
                className={styles.saveButton}
              >
                {saving ? "Saving..." : "Save Custom Duration"}
              </Button>
            </div>
            <p className={styles.customDescription}>
              Enter the number of minutes after which your status should be
              automatically cleared.
            </p>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Current Setting</h3>
        <p className={styles.sectionDescription}>
          Your status will be automatically cleared after the selected duration.
        </p>
        <div className={styles.currentSetting}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Status Duration:</span>
            <span className={styles.settingValue}>
              {showCustomInput && customDuration
                ? formatDuration(parseInt(customDuration))
                : formatDuration(statusDuration)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>How It Works</h3>
        <ul className={styles.infoList}>
          <li>
            When you set a status message, it will automatically be cleared after
            the selected duration.
          </li>
          <li>
            You can choose from preset durations (30 minutes, 1 hour, 8 hours) or
            set a custom duration.
          </li>
          <li>
            If you set a custom duration, it will be saved and used for future
            status messages.
          </li>
          <li>
            You can change this setting at any time, and it will apply to all
            future status messages.
          </li>
        </ul>
      </div>
    </div>
  );
}

