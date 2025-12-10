"use client";

import { useState } from "react";
import Modal from "../Modal/Modal.jsx";
import InputBox from "../InputBox/InputBox.jsx";
import Button from "../Button/Button.jsx";
import styles from "./EventCreator.module.css";

export default function EventCreator({ isOpen, onClose, groupId, onCreateEvent }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    isAllDay: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.startDate) {
      setError("Start date is required");
      return;
    }

    setLoading(true);

    try {
      const startDateTime = formData.isAllDay
        ? new Date(formData.startDate)
        : new Date(`${formData.startDate}T${formData.startTime}`);

      const endDateTime = formData.endDate
        ? formData.isAllDay
          ? new Date(formData.endDate)
          : new Date(`${formData.endDate}T${formData.endTime}`)
        : null;

      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/groups/events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          location: formData.location.trim(),
          startDate: startDateTime.toISOString(),
          endDate: endDateTime ? endDateTime.toISOString() : null,
          isAllDay: formData.isAllDay,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      onCreateEvent(data.event);
      setFormData({
        title: "",
        description: "",
        location: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        isAllDay: false,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Event">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="title">Event Title *</label>
          <InputBox
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter event title"
            required
            disabled={loading}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="description">Description</label>
          <InputBox
            id="description"
            type="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter event description"
            disabled={loading}
            rows={3}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="location">Location</label>
          <InputBox
            id="location"
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Enter location"
            disabled={loading}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={formData.isAllDay}
              onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
              disabled={loading}
            />
            All-day event
          </label>
        </div>

        <div className={styles.dateTimeRow}>
          <div className={styles.field}>
            <label htmlFor="startDate">Start Date *</label>
            <InputBox
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          {!formData.isAllDay && (
            <div className={styles.field}>
              <label htmlFor="startTime">Start Time</label>
              <InputBox
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                disabled={loading}
              />
            </div>
          )}
        </div>

        <div className={styles.dateTimeRow}>
          <div className={styles.field}>
            <label htmlFor="endDate">End Date (optional)</label>
            <InputBox
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              disabled={loading}
            />
          </div>
          {!formData.isAllDay && formData.endDate && (
            <div className={styles.field}>
              <label htmlFor="endTime">End Time</label>
              <InputBox
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                disabled={loading}
              />
            </div>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

