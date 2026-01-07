"use client";

import { useEffect, useState } from "react";
import Button from "../../../components/Button/Button.jsx";
import styles from "./page.module.css";

export default function ConnectedCalendarsPage() {
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const calendarProviders = [
    {
      id: "google",
      name: "Google Calendar",
      icon: "📅",
      description: "Sync your Google Calendar events",
      color: "#4285F4",
    },
    {
      id: "outlook",
      name: "Microsoft Outlook",
      icon: "📆",
      description: "Connect your Outlook calendar",
      color: "#0078D4",
    },
    {
      id: "apple",
      name: "Apple iCloud",
      icon: "🍎",
      description: "Sync with your iCloud calendar",
      color: "#000000",
    },
    {
      id: "ical",
      name: "iCal / CalDAV",
      icon: "📋",
      description: "Connect via CalDAV protocol",
      color: "#666666",
    },
  ];

  useEffect(() => {
    fetchCalendars();
  }, []);

  const fetchCalendars = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/calendars", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCalendars(data.calendars || []);
      } else if (response.status === 404) {
        // No calendars endpoint yet, use empty array
        setCalendars([]);
      }
    } catch (error) {
      console.error("Error fetching calendars:", error);
      // Don't show error if endpoint doesn't exist yet
      setCalendars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (providerId) => {
    setConnecting(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/calendars/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ provider: providerId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          // Redirect to OAuth flow
          window.location.href = data.authUrl;
        } else {
          setSuccess(`${calendarProviders.find(p => p.id === providerId)?.name} connected successfully`);
          fetchCalendars();
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to connect calendar");
      }
    } catch (error) {
      setError(error.message || "Failed to connect calendar");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (calendarId) => {
    setConnecting(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/calendars/${calendarId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess("Calendar disconnected successfully");
        fetchCalendars();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect calendar");
      }
    } catch (error) {
      setError(error.message || "Failed to disconnect calendar");
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async (calendarId) => {
    setConnecting(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/calendars/${calendarId}/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess("Calendar synced successfully");
        fetchCalendars();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to sync calendar");
      }
    } catch (error) {
      setError(error.message || "Failed to sync calendar");
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const connectedCalendarIds = calendars.map((cal) => cal.provider);

  return (
    <div className={styles.calendarsSettings}>
      <h2 className={styles.title}>Connected Calendars</h2>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Available Calendars</h3>
        <p className={styles.sectionDescription}>
          Connect your calendars to sync events and manage your schedule
        </p>

        <div className={styles.calendarList}>
          {calendarProviders.map((provider) => {
            const isConnected = connectedCalendarIds.includes(provider.id);
            const connectedCalendar = calendars.find(
              (cal) => cal.provider === provider.id
            );

            return (
              <div key={provider.id} className={styles.calendarItem}>
                <div className={styles.calendarInfo}>
                  <div
                    className={styles.calendarIcon}
                    style={{ backgroundColor: `${provider.color}20` }}
                  >
                    <span style={{ fontSize: "1.5rem" }}>{provider.icon}</span>
                  </div>
                  <div className={styles.calendarDetails}>
                    <h4 className={styles.calendarName}>{provider.name}</h4>
                    <p className={styles.calendarDescription}>
                      {provider.description}
                    </p>
                    {isConnected && connectedCalendar && (
                      <div className={styles.connectionInfo}>
                        <span className={styles.connectedBadge}>
                          ✓ Connected
                        </span>
                        {connectedCalendar.email && (
                          <span className={styles.calendarEmail}>
                            {connectedCalendar.email}
                          </span>
                        )}
                        {connectedCalendar.lastSync && (
                          <span className={styles.lastSync}>
                            Last synced:{" "}
                            {new Date(connectedCalendar.lastSync).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.calendarActions}>
                  {isConnected ? (
                    <>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleSync(connectedCalendar.id)}
                        disabled={connecting}
                      >
                        Sync Now
                      </Button>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => handleDisconnect(connectedCalendar.id)}
                        disabled={connecting}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => handleConnect(provider.id)}
                      disabled={connecting}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {calendars.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Sync Settings</h3>
          <p className={styles.sectionDescription}>
            Configure how your calendars sync with the app
          </p>

          <div className={styles.syncSettings}>
            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <label className={styles.label}>Auto-sync</label>
                <p className={styles.description}>
                  Automatically sync calendars every hour
                </p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <label className={styles.label}>Show events in chat</label>
                <p className={styles.description}>
                  Display calendar events in your chat interface
                </p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <label className={styles.label}>Busy status</label>
                <p className={styles.description}>
                  Show when you're busy based on calendar events
                </p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

