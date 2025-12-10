"use client";

import { useState } from "react";
import Modal from "../Modal/Modal.jsx";
import styles from "./ScheduleMessageModal.module.css";

export default function ScheduleMessageModal({
  message,
  onSchedule,
  onClose,
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState(message?.priority || "normal");
  const [tags, setTags] = useState(message?.tags || []);

  const handleSchedule = async () => {
    if (!date || !time) {
      alert("Please select both date and time");
      return;
    }

    const sendAt = new Date(`${date}T${time}`);
    if (sendAt <= new Date()) {
      alert("Please select a future date and time");
      return;
    }

    await onSchedule({
      ...message,
      sendAt: sendAt.toISOString(),
      priority,
      tags,
    });
    onClose();
  };

  const handleTagToggle = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];
  const defaultTime = "09:00";

  return (
    <Modal isOpen={true} onClose={onClose} title="Schedule Message">
      <div className={styles.scheduleModal}>
        <div className={styles.preview}>
          <div className={styles.previewLabel}>Message:</div>
          <div className={styles.previewContent}>
            {message?.content || "No content"}
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
          <div className={styles.field}>
            <label>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Tags</label>
            <div className={styles.tags}>
              {["important", "todo", "reminder"].map((tag) => (
                <label key={tag} className={styles.tagLabel}>
                  <input
                    type="checkbox"
                    checked={tags.includes(tag)}
                    onChange={() => handleTagToggle(tag)}
                  />
                  <span>{tag}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.scheduleButton} onClick={handleSchedule}>
            Schedule
          </button>
        </div>
      </div>
    </Modal>
  );
}

