"use client";

import { useState } from "react";
import Modal from "../Modal/Modal.jsx";
import styles from "./ReminderModal.module.css";

export default function ReminderModal({ message, onSetReminder, onClose }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [preset, setPreset] = useState("");

  const handlePreset = (minutes) => {
    const remindAt = new Date();
    remindAt.setMinutes(remindAt.getMinutes() + minutes);
    setDate(remindAt.toISOString().split("T")[0]);
    setTime(remindAt.toTimeString().slice(0, 5));
    setPreset(minutes.toString());
  };

  const handleSetReminder = async () => {
    if (!date || !time) {
      alert("Please select both date and time");
      return;
    }

    const remindAt = new Date(`${date}T${time}`);
    if (remindAt <= new Date()) {
      alert("Please select a future date and time");
      return;
    }

    await onSetReminder(message._id, remindAt.toISOString());
    onClose();
  };

  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];
  const defaultTime = "09:00";

  return (
    <Modal isOpen={true} onClose={onClose} title="Set Reminder">
      <div className={styles.reminderModal}>
        <div className={styles.preview}>
          <div className={styles.previewLabel}>Message:</div>
          <div className={styles.previewContent}>
            {message?.content || "No content"}
          </div>
        </div>
        <div className={styles.presets}>
          <div className={styles.presetLabel}>Quick Reminders:</div>
          <div className={styles.presetButtons}>
            <button
              className={preset === "15" ? styles.active : ""}
              onClick={() => handlePreset(15)}
            >
              In 15 min
            </button>
            <button
              className={preset === "30" ? styles.active : ""}
              onClick={() => handlePreset(30)}
            >
              In 30 min
            </button>
            <button
              className={preset === "60" ? styles.active : ""}
              onClick={() => handlePreset(60)}
            >
              In 1 hour
            </button>
            <button
              className={preset === "1440" ? styles.active : ""}
              onClick={() => handlePreset(1440)}
            >
              Tomorrow
            </button>
          </div>
        </div>
        <div className={styles.form}>
          <div className={styles.field}>
            <label>Date</label>
            <input
              type="date"
              value={date || defaultDate}
              onChange={(e) => setDate(e.target.value)}
              min={defaultDate}
            />
          </div>
          <div className={styles.field}>
            <label>Time</label>
            <input
              type="time"
              value={time || defaultTime}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.setButton} onClick={handleSetReminder}>
            Set Reminder
          </button>
        </div>
      </div>
    </Modal>
  );
}

