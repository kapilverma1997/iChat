"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InputBox from "../../../components/InputBox/InputBox.jsx";
import Button from "../../../components/Button/Button.jsx";
import AvatarUploader from "../../../components/AvatarUploader/AvatarUploader.jsx";
import StatusBadge from "../../../components/StatusBadge/StatusBadge.jsx";
import styles from "./page.module.css";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "",
    statusMessage: "",
    presenceStatus: "offline",
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          designation: data.user.designation || "",
          statusMessage: data.user.statusMessage || "",
          presenceStatus: data.user.presenceStatus || "offline",
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");

      // Update profile fields (name, email, phone, designation)
      const profileResponse = await fetch("/api/user/update-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          designation: formData.designation,
        }),
      });

      if (!profileResponse.ok) {
        const data = await profileResponse.json();
        throw new Error(data.error || "Failed to update profile");
      }

      // Update status fields (presenceStatus, statusMessage)
      const statusResponse = await fetch("/api/user/update-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          presenceStatus: formData.presenceStatus,
          statusMessage: formData.statusMessage,
        }),
      });

      if (!statusResponse.ok) {
        const data = await statusResponse.json();
        throw new Error(data.error || "Failed to update status");
      }

      setSuccess("Profile updated successfully");
      fetchUser();
    } catch (error) {
      setError(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("profilePhoto", file);

      const response = await fetch("/api/user/update-profile", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        fetchUser();
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.profileSettings}>
      <h2 className={styles.title}>Profile Settings</h2>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Profile Photo</h3>
          <AvatarUploader
            currentPhoto={user?.profilePhoto}
            onUpload={handleAvatarUpload}
            size="large"
          />
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Personal Information</h3>
          <InputBox
            label="Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter your full name"
            required
          />
          <InputBox
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="Enter your email address"
            required
          />
          <InputBox
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="Enter your phone number"
          />
          <InputBox
            label="Designation"
            type="text"
            value={formData.designation}
            onChange={(e) =>
              setFormData({ ...formData, designation: e.target.value })
            }
            placeholder="Enter your job title or designation"
          />
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Status</h3>
          {/* <StatusBadge
            status={formData.presenceStatus}
            onStatusChange={(status) => setFormData({ ...formData, presenceStatus: status })}
          /> */}
          <InputBox
            label="Status Message"
            type="text"
            value={formData.statusMessage}
            onChange={(e) =>
              setFormData({ ...formData, statusMessage: e.target.value })
            }
            placeholder="What's on your mind?"
            maxLength={100}
          />
        </div>

        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
