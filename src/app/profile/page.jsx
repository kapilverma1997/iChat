"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "../../components/ProtectedLayout/ProtectedLayout.jsx";
import InputBox from "../../components/InputBox/InputBox.jsx";
import Button from "../../components/Button/Button.jsx";
import AvatarUploader from "../../components/AvatarUploader/AvatarUploader.jsx";
import StatusBadge from "../../components/StatusBadge/StatusBadge.jsx";
import Dropdown from "../../components/Dropdown/Dropdown.jsx";
import ThemeSelector from "../../components/ThemeSelector/ThemeSelector.jsx";
import LanguageSelector from "../../components/LanguageSelector/LanguageSelector.jsx";
import styles from "./page.module.css";

export default function ProfilePage() {
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
    theme: "light",
    language: "en",
    privacySettings: {
      showProfilePhoto: true,
      showLastSeen: true,
      showStatus: true,
      showDesignation: true,
    },
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch("/api/user/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await response.json();
      setUser(data.user);
      setFormData({
        name: data.user.name || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
        designation: data.user.designation || "",
        statusMessage: data.user.statusMessage || "",
        presenceStatus: data.user.presenceStatus || "offline",
        theme: data.user.theme || "light",
        language: data.user.language || "en",
        privacySettings: data.user.privacySettings || {
          showProfilePhoto: true,
          showLastSeen: true,
          showStatus: true,
          showDesignation: true,
        },
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    // Convert file to base64 or upload to storage service
    // For now, we'll use a simple base64 approach
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      await updateProfile({ profilePhoto: base64String });
    };
    reader.readAsDataURL(file);
  };

  const updateProfile = async (updates) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/update-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      const data = await response.json();
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const updateStatus = async (updates) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/update-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      const data = await response.json();
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const updateTheme = async (theme, customTheme, chatWallpaper) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/update-theme", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ theme, customTheme, chatWallpaper }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update theme");
      }

      const data = await response.json();
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const updateLanguage = async (language) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/update-language", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ language }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update language");
      }

      const data = await response.json();
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const updatePrivacy = async (privacySettings) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/update-privacy", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ privacySettings }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update privacy settings");
      }

      const data = await response.json();
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        designation: formData.designation,
      });

      await updateStatus({
        presenceStatus: formData.presenceStatus,
        statusMessage: formData.statusMessage,
      });

      await updateTheme(formData.theme);
      await updateLanguage(formData.language);
      await updatePrivacy(formData.privacySettings);

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <div className={styles.loading}>Loading...</div>
      </ProtectedLayout>
    );
  }

  const presenceOptions = [
    { value: "online", label: "Online" },
    { value: "offline", label: "Offline" },
    { value: "away", label: "Away" },
    { value: "do-not-disturb", label: "Do Not Disturb" },
  ];

  return (
    <ProtectedLayout>
      <div className={styles.profile}>
        <header className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Back
          </button>
          <h1>Profile Settings</h1>
        </header>

        <main className={styles.main}>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Profile Photo</h2>
            <AvatarUploader
              currentPhoto={user?.profilePhoto}
              onUpload={handleAvatarUpload}
              size="large"
            />
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Basic Information</h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="name">Full Name</label>
                <InputBox
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <InputBox
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className={styles.disabled}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="phone">Phone</label>
                <InputBox
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="designation">Designation</label>
                <InputBox
                  id="designation"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  placeholder="e.g., Software Engineer"
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Presence & Status</h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="presenceStatus">Presence Status</label>
                <Dropdown
                  options={presenceOptions}
                  value={formData.presenceStatus}
                  onChange={(value) =>
                    setFormData({ ...formData, presenceStatus: value })
                  }
                />
                <div style={{ marginTop: "8px" }}>
                  <StatusBadge status={formData.presenceStatus} showLabel />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="statusMessage">Status Message</label>
                <InputBox
                  id="statusMessage"
                  value={formData.statusMessage}
                  onChange={(e) =>
                    setFormData({ ...formData, statusMessage: e.target.value })
                  }
                  placeholder="e.g., Busy, WFH today, etc."
                  maxLength={100}
                />
                <small
                  style={{
                    color: "#6b7280",
                    marginTop: "4px",
                    display: "block",
                  }}
                >
                  {formData.statusMessage.length}/100 characters
                </small>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Appearance</h2>
            <div className={styles.form}>
              <ThemeSelector
                currentTheme={formData.theme}
                onThemeChange={(theme) => setFormData({ ...formData, theme })}
              />
              <LanguageSelector
                currentLanguage={formData.language}
                onLanguageChange={(language) =>
                  setFormData({ ...formData, language })
                }
                className={styles.languageField}
              />
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Privacy Settings</h2>
            <div className={styles.form}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.privacySettings.showProfilePhoto}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      privacySettings: {
                        ...formData.privacySettings,
                        showProfilePhoto: e.target.checked,
                      },
                    })
                  }
                />
                <span>Show profile photo</span>
              </label>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.privacySettings.showLastSeen}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      privacySettings: {
                        ...formData.privacySettings,
                        showLastSeen: e.target.checked,
                      },
                    })
                  }
                />
                <span>Show last seen</span>
              </label>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.privacySettings.showStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      privacySettings: {
                        ...formData.privacySettings,
                        showStatus: e.target.checked,
                      },
                    })
                  }
                />
                <span>Show status message</span>
              </label>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.privacySettings.showDesignation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      privacySettings: {
                        ...formData.privacySettings,
                        showDesignation: e.target.checked,
                      },
                    })
                  }
                />
                <span>Show designation</span>
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </main>
      </div>
    </ProtectedLayout>
  );
}
