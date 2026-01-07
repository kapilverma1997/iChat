"use client";

import { useState, useEffect } from "react";
import Modal from "../Modal/Modal.jsx";
import ProfileCard from "../ProfileCard/ProfileCard.jsx";
import styles from "./UserProfileModal.module.css";

export default function UserProfileModal({ isOpen, onClose, userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile();
    } else {
      // Reset state when modal closes
      setUser(null);
      setError(null);
    }
  }, [isOpen, userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(`/api/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(err.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile">
      <div className={styles.container}>
        {loading && (
          <div className={styles.loading}>Loading profile...</div>
        )}
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={fetchUserProfile} className={styles.retryButton}>
              Retry
            </button>
          </div>
        )}
        {!loading && !error && user && (
          <ProfileCard user={user} showActions={false} />
        )}
      </div>
    </Modal>
  );
}

