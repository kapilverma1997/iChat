"use client";

import { useState, useEffect } from "react";
import styles from "./StatusDurationMenu.module.css";

const durations = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 480, label: "8 hours" },
  { value: null, label: "Custom" },
];

export default function StatusDurationMenu({ currentDuration, onDurationChange }) {
  const [selectedDuration, setSelectedDuration] = useState(currentDuration);
  const [customDuration, setCustomDuration] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    setSelectedDuration(currentDuration);
    if (currentDuration && !durations.find((d) => d.value === currentDuration)) {
      setShowCustomInput(true);
      setCustomDuration(currentDuration.toString());
    }
  }, [currentDuration]);

  const handleDurationSelect = async (duration) => {
    setSelectedDuration(duration);
    
    if (duration === null) {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      await saveDuration(duration);
    }
  };

  const handleCustomDuration = async () => {
    const minutes = parseInt(customDuration);
    if (isNaN(minutes) || minutes <= 0) {
      alert("Please enter a valid number of minutes");
      return;
    }
    await saveDuration(minutes);
  };

  const saveDuration = async (duration) => {
    try {
      const token = localStorage.getItem("accessToken");
      await fetch("/api/settings/statusDuration", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          statusDuration: duration === null ? null : duration,
          customStatusDuration: duration === null ? parseInt(customDuration) : null,
        }),
      });

      if (onDurationChange) {
        onDurationChange(duration);
      }
    } catch (error) {
      console.error("Error updating status duration:", error);
    }
  };

  return (
    <div className={styles.statusDurationMenu}>
      <h3>Status Duration</h3>
      <p className={styles.description}>
        Automatically clear your status after the selected duration
      </p>
      
      <div className={styles.options}>
        {durations.map((duration) => (
          <label key={duration.value || "custom"} className={styles.option}>
            <input
              type="radio"
              name="statusDuration"
              value={duration.value || "custom"}
              checked={
                duration.value === null
                  ? showCustomInput
                  : selectedDuration === duration.value
              }
              onChange={() => handleDurationSelect(duration.value)}
            />
            <span>{duration.label}</span>
          </label>
        ))}
      </div>

      {showCustomInput && (
        <div className={styles.customInput}>
          <input
            type="number"
            placeholder="Enter minutes"
            value={customDuration}
            onChange={(e) => setCustomDuration(e.target.value)}
            min="1"
            className={styles.numberInput}
          />
          <button onClick={handleCustomDuration} className={styles.saveButton}>
            Save
          </button>
        </div>
      )}
    </div>
  );
}

