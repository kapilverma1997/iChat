"use client";

import { useState, useEffect } from "react";
import Modal from "../Modal/Modal.jsx";
import EventDisplay from "../EventDisplay/EventDisplay.jsx";
import styles from "./EventDetailsModal.module.css";

export default function EventDetailsModal({ isOpen, onClose, event, currentUserId, onEventUpdate }) {
  const [eventData, setEventData] = useState(event);

  useEffect(() => {
    setEventData(event);
  }, [event]);

  if (!eventData) {
    return null;
  }

  const formatDateTime = (dateString, isAllDay) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isAllDay) {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAttendeesByStatus = (status) => {
    return eventData.attendees?.filter((a) => a.status === status) || [];
  };

  const going = getAttendeesByStatus("going");
  const maybe = getAttendeesByStatus("maybe");
  const notGoing = getAttendeesByStatus("not-going");

  const handleEventUpdate = (updatedEvent) => {
    setEventData(updatedEvent);
    if (onEventUpdate) {
      onEventUpdate(updatedEvent);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Event Details">
      <div className={styles.eventDetailsModal}>
        <div className={styles.eventHeader}>
          <h2 className={styles.title}>{eventData.title}</h2>
          {eventData.isCancelled && (
            <span className={styles.badgeCancelled}>Cancelled</span>
          )}
          {!eventData.isCancelled &&
            (eventData.endDate
              ? new Date(eventData.endDate) < new Date()
              : new Date(eventData.startDate) < new Date()) && (
              <span className={styles.badgePast}>Past Event</span>
            )}
        </div>

        <div className={styles.eventInfo}>
          <div className={styles.infoRow}>
            <span className={styles.label}>📅 Start Date & Time</span>
            <span className={styles.value}>
              {formatDateTime(eventData.startDate, eventData.isAllDay)}
            </span>
          </div>

          {eventData.endDate && (
            <div className={styles.infoRow}>
              <span className={styles.label}>⏰ End Date & Time</span>
              <span className={styles.value}>
                {formatDateTime(eventData.endDate, eventData.isAllDay)}
              </span>
            </div>
          )}

          {eventData.location && (
            <div className={styles.infoRow}>
              <span className={styles.label}>📍 Location</span>
              <span className={styles.value}>{eventData.location}</span>
            </div>
          )}

          {eventData.description && (
            <div className={styles.infoRow}>
              <span className={styles.label}>📝 Description</span>
              <div className={styles.description}>{eventData.description}</div>
            </div>
          )}

          {eventData.createdBy && (
            <div className={styles.infoRow}>
              <span className={styles.label}>👤 Created By</span>
              <span className={styles.value}>
                {eventData.createdBy.name || eventData.createdBy.email}
              </span>
            </div>
          )}
        </div>

        <div className={styles.rsvpSection}>
          <EventDisplay
            event={eventData}
            currentUserId={currentUserId}
            onEventUpdate={handleEventUpdate}
            onClick={null}
          />
        </div>

        <div className={styles.attendeesSection}>
          <h3 className={styles.sectionTitle}>Attendees</h3>
          
          {going.length > 0 && (
            <div className={styles.attendeeGroup}>
              <div className={styles.attendeeGroupHeader}>
                <span className={styles.attendeeStatus}>✓ Going ({going.length})</span>
              </div>
              <div className={styles.attendeeList}>
                {going.map((attendee, index) => (
                  <div key={index} className={styles.attendee}>
                    <span className={styles.attendeeName}>
                      {attendee.userId?.name || attendee.userId?.email || "Unknown"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {maybe.length > 0 && (
            <div className={styles.attendeeGroup}>
              <div className={styles.attendeeGroupHeader}>
                <span className={styles.attendeeStatus}>? Maybe ({maybe.length})</span>
              </div>
              <div className={styles.attendeeList}>
                {maybe.map((attendee, index) => (
                  <div key={index} className={styles.attendee}>
                    <span className={styles.attendeeName}>
                      {attendee.userId?.name || attendee.userId?.email || "Unknown"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notGoing.length > 0 && (
            <div className={styles.attendeeGroup}>
              <div className={styles.attendeeGroupHeader}>
                <span className={styles.attendeeStatus}>✗ Can't Go ({notGoing.length})</span>
              </div>
              <div className={styles.attendeeList}>
                {notGoing.map((attendee, index) => (
                  <div key={index} className={styles.attendee}>
                    <span className={styles.attendeeName}>
                      {attendee.userId?.name || attendee.userId?.email || "Unknown"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {eventData.attendees?.length === 0 && (
            <div className={styles.noAttendees}>No attendees yet</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

