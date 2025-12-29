"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../../components/AdminLayout/AdminLayout.jsx";
import styles from "./page.module.css";

export default function ActiveUsersPage() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, online, offline
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(1); // Reset to page 1 when filter or search changes
  }, [filter, search]);

  const fetchActiveUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filter === "online") {
        params.append("isOnline", "true");
      } else if (filter === "offline") {
        params.append("isOnline", "false");
      }
      if (search.trim()) {
        params.append("search", search.trim());
      }

      const response = await fetch(
        `/api/admin/activeUsers?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setActiveUsers(data.activeUsers || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching active users:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, page, limit, search]);

  useEffect(() => {
    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchActiveUsers]);

  const formatTime = (date) => {
    if (!date) return "Never";
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Active Users</h1>
          <div className={styles.filters}>
            <button
              className={`${styles.filterButton} ${
                filter === "all" ? styles.active : ""
              }`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`${styles.filterButton} ${
                filter === "online" ? styles.active : ""
              }`}
              onClick={() => setFilter("online")}
            >
              Online
            </button>
            <button
              className={`${styles.filterButton} ${
                filter === "offline" ? styles.active : ""
              }`}
              onClick={() => setFilter("offline")}
            >
              Offline
            </button>
          </div>
        </div>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by user name, email, device, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {total > limit && (
          <div className={styles.pagination}>
            <button
              className={styles.pageButton}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {page} of {Math.ceil(total / limit)} ({total} total)
            </span>
            <button
              className={styles.pageButton}
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / limit)}
            >
              Next
            </button>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>Loading active users...</div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Device</th>
                    <th>Location</th>
                    <th>Current Activity</th>
                    <th>Last Activity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className={styles.noData}>
                        No active users found
                      </td>
                    </tr>
                  ) : (
                    activeUsers.map((activeUser) => (
                      <tr key={activeUser._id}>
                        <td>
                          <div className={styles.userInfo}>
                            <img
                              src={
                                activeUser.userId?.profilePhoto ||
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23e5e7eb'/%3E%3C/svg%3E"
                              }
                              alt={activeUser.userId?.name || "User"}
                              className={styles.avatar}
                              onError={(e) => {
                                e.target.src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23e5e7eb'/%3E%3C/svg%3E";
                              }}
                            />
                            <div>
                              <div className={styles.userName}>
                                {activeUser.userId?.name || "Unknown"}
                              </div>
                              <div className={styles.userEmail}>
                                {activeUser.userId?.email || ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.deviceInfo}>
                            <div>
                              {activeUser.deviceName ||
                                activeUser.deviceType ||
                                "Unknown"}
                            </div>
                            <div className={styles.deviceMeta}>
                              {activeUser.browser} / {activeUser.os}
                            </div>
                          </div>
                        </td>
                        <td>
                          {activeUser.location?.city &&
                          activeUser.location?.country
                            ? `${activeUser.location.city}, ${activeUser.location.country}`
                            : "Unknown"}
                        </td>
                        <td>
                          {activeUser.currentChatId
                            ? "In Chat"
                            : activeUser.currentGroupId
                            ? "In Group"
                            : "Idle"}
                        </td>
                        <td>{formatTime(activeUser.lastActivityAt)}</td>
                        <td>
                          <span
                            className={`${styles.status} ${
                              activeUser.isOnline
                                ? styles.online
                                : styles.offline
                            }`}
                          >
                            {activeUser.isOnline ? "🟢 Online" : "⚫ Offline"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
