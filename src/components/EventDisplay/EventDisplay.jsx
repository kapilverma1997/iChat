"use client";

import { useState, useEffect } from "react";
import styles from "./EventDisplay.module.css";

export default function EventDisplay({
  event,
  currentUserId,
  onEventUpdate,
  onClick,
}) {
  const [userStatus, setUserStatus] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  // Initialize user status based on event attendees
  useEffect(() => {
    if (event && event.attendees && currentUserId) {
      const userAttendee = event.attendees.find(
        (attendee) =>
          attendee.userId?._id?.toString() === currentUserId?.toString() ||
          attendee.userId?.toString() === currentUserId?.toString()
      );
      setUserStatus(userAttendee?.status || null);
    }
  }, [event, currentUserId]);

  if (!event) {
    return <div className={styles.event}>Loading event...</div>;
  }

  const isCancelled = event.isCancelled;
  const isPast = event.endDate
    ? new Date(event.endDate) < new Date()
    : new Date(event.startDate) < new Date();

  const formatDateTime = (dateString, isAllDay) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isAllDay) {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStatusChange = async (status) => {
    if (isUpdating || isCancelled || isPast) return;

    setIsUpdating(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/groups/events/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: event._id,
          status,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update RSVP");
      }

      setUserStatus(status);
      if (data.event && onEventUpdate) {
        onEventUpdate(data.event);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getAttendeeCounts = () => {
    const going =
      event.attendees?.filter((a) => a.status === "going").length || 0;
    const maybe =
      event.attendees?.filter((a) => a.status === "maybe").length || 0;
    const notGoing =
      event.attendees?.filter((a) => a.status === "not-going").length || 0;
    return { going, maybe, notGoing, total: event.attendees?.length || 0 };
  };

  const counts = getAttendeeCounts();

  return (
    <div className={styles.eventContainer} onClick={onClick}>
      <div className={styles.eventHeader}>
        <h3 className={styles.title}>{event.title}</h3>
        {isCancelled && (
          <span className={styles.badgeCancelled}>Cancelled</span>
        )}
        {isPast && !isCancelled && (
          <span className={styles.badgePast}>Past Event</span>
        )}
      </div>

      <div className={styles.eventDetails}>
        <div className={styles.detailRow}>
          <span className={styles.icon}>📅</span>
          <div className={styles.detailContent}>
            <div className={styles.detailLabel}>Start</div>
            <div className={styles.detailValue}>
              {formatDateTime(event.startDate, event.isAllDay)}
            </div>
          </div>
        </div>

        {event.endDate && (
          <div className={styles.detailRow}>
            <span className={styles.icon}>⏰</span>
            <div className={styles.detailContent}>
              <div className={styles.detailLabel}>End</div>
              <div className={styles.detailValue}>
                {formatDateTime(event.endDate, event.isAllDay)}
              </div>
            </div>
          </div>
        )}

        {event.location && (
          <div className={styles.detailRow}>
            <span className={styles.icon}>📍</span>
            <div className={styles.detailContent}>
              <div className={styles.detailLabel}>Location</div>
              <div className={styles.detailValue}>{event.location}</div>
            </div>
          </div>
        )}

        {event.description && (
          <div className={styles.description}>{event.description}</div>
        )}
      </div>

      {!isCancelled && !isPast && (
        <div className={styles.rsvpSection}>
          <div className={styles.rsvpButtons}>
            <button
              className={`${styles.rsvpButton} ${
                userStatus === "going" ? styles.active : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange("going");
              }}
              disabled={isUpdating}
            >
              ✓ Going
            </button>
            <button
              className={`${styles.rsvpButton} ${
                userStatus === "maybe" ? styles.active : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange("maybe");
              }}
              disabled={isUpdating}
            >
              ? Maybe
            </button>
            <button
              className={`${styles.rsvpButton} ${
                userStatus === "not-going" ? styles.active : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange("not-going");
              }}
              disabled={isUpdating}
            >
              ✗ Can't Go
            </button>
          </div>
        </div>
      )}

      <div className={styles.eventFooter}>
        <span className={styles.attendeeCount}>
          {counts.going} going{counts.maybe > 0 && ` • ${counts.maybe} maybe`}
          {counts.total > 0 && ` • ${counts.total} total`}
        </span>
        {onClick && (
          <span className={styles.viewDetails}>Click to view full details</span>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
