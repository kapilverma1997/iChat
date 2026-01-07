"use client";

import { useEffect, useState } from "react";
import Button from "../../../components/Button/Button.jsx";
import InputBox from "../../../components/InputBox/InputBox.jsx";
import TwoFactorModal from "../../../components/TwoFactorModal/TwoFactorModal.jsx";
import styles from "./page.module.css";

export default function PrivacySecurityPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    showProfilePhoto: true,
    showLastSeen: true,
    showStatus: true,
    showDesignation: true,
  });

  // Security settings
  const [chatSecurity, setChatSecurity] = useState({
    screenshotBlocking: false,
    watermarkEnabled: false,
    disableCopy: false,
    disableForward: false,
    disableDownload: false,
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // 2FA
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorType, setTwoFactorType] = useState(null);

  // Trusted devices
  const [trustedDevices, setTrustedDevices] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setPrivacySettings({
          showProfilePhoto: data.user.privacySettings?.showProfilePhoto ?? true,
          showLastSeen: data.user.privacySettings?.showLastSeen ?? true,
          showStatus: data.user.privacySettings?.showStatus ?? true,
          showDesignation: data.user.privacySettings?.showDesignation ?? true,
        });
        setChatSecurity({
          screenshotBlocking:
            data.user.chatSecurity?.screenshotBlocking ?? false,
          watermarkEnabled: data.user.chatSecurity?.watermarkEnabled ?? false,
          disableCopy: data.user.chatSecurity?.disableCopy ?? false,
          disableForward: data.user.chatSecurity?.disableForward ?? false,
          disableDownload: data.user.chatSecurity?.disableDownload ?? false,
        });
        setTwoFactorEnabled(data.user.twoFactorEnabled ?? false);
        setTwoFactorType(data.user.twoFactorType || null);
        setTrustedDevices(data.user.trustedDevices || []);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyChange = async (key, value) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const updatedSettings = { ...privacySettings, [key]: value };

      const response = await fetch("/api/user/update-privacy", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          privacySettings: updatedSettings,
        }),
      });

      if (response.ok) {
        setPrivacySettings(updatedSettings);
        setSuccess("Privacy settings updated successfully");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update privacy settings");
      }
    } catch (error) {
      setError(error.message || "Failed to update privacy settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSecurityChange = async (key, value) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const updatedSettings = { ...chatSecurity, [key]: value };

      const response = await fetch("/api/user/update-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatSecurity: updatedSettings,
        }),
      });

      if (response.ok) {
        setChatSecurity(updatedSettings);
        setSuccess("Security settings updated successfully");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update security settings");
      }
    } catch (error) {
      setError(error.message || "Failed to update security settings");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      setSaving(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setSuccess("Password changed successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to change password");
      }
    } catch (error) {
      setError(error.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt(
      "Enter your password to disable two-factor authentication:"
    );

    if (!password) {
      return;
    }

    if (
      !confirm("Are you sure you want to disable two-factor authentication?")
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/security/verify2FA", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setTwoFactorEnabled(false);
        setTwoFactorType(null);
        setSuccess("Two-factor authentication disabled");
        fetchUserData();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to disable 2FA");
      }
    } catch (error) {
      setError(error.message || "Failed to disable 2FA");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    if (!confirm("Are you sure you want to remove this trusted device?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/remove-trusted-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId }),
      });

      if (response.ok) {
        setTrustedDevices(
          trustedDevices.filter((d) => d.deviceId !== deviceId)
        );
        setSuccess("Device removed successfully");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove device");
      }
    } catch (error) {
      setError(error.message || "Failed to remove device");
    }
  };

  const handle2FASuccess = () => {
    setShow2FAModal(false);
    setTwoFactorEnabled(true);
    fetchUserData();
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.privacySecurity}>
      <h2 className={styles.title}>Privacy & Security</h2>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {/* Privacy Settings */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Privacy Settings</h3>
        <p className={styles.sectionDescription}>
          Control who can see your information
        </p>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Show Profile Photo</label>
            <p className={styles.description}>
              Allow others to see your profile picture
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={privacySettings.showProfilePhoto}
              onChange={(e) =>
                handlePrivacyChange("showProfilePhoto", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Show Last Seen</label>
            <p className={styles.description}>Show when you were last active</p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={privacySettings.showLastSeen}
              onChange={(e) =>
                handlePrivacyChange("showLastSeen", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Show Status</label>
            <p className={styles.description}>
              Display your current status message
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={privacySettings.showStatus}
              onChange={(e) =>
                handlePrivacyChange("showStatus", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Show Designation</label>
            <p className={styles.description}>
              Display your job title or designation
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={privacySettings.showDesignation}
              onChange={(e) =>
                handlePrivacyChange("showDesignation", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>

      {/* Security Settings */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Chat Security</h3>
        <p className={styles.sectionDescription}>
          Additional security options for your messages
        </p>

        {/* <div className={styles.setting}> */}
        {/* <div className={styles.settingInfo}>
            <label className={styles.label}>Screenshot Blocking</label>
            <p className={styles.description}>
              Attempt to detect and block screenshots (experimental)
            </p>
          </div> */}
        {/* <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSecurity.screenshotBlocking}
              onChange={(e) =>
                handleSecurityChange("screenshotBlocking", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label> */}
        {/* </div> */}

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Watermark Messages</label>
            <p className={styles.description}>
              Add watermark with email, user ID, and timestamp to messages
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSecurity.watermarkEnabled}
              onChange={(e) =>
                handleSecurityChange("watermarkEnabled", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        {/* <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Disable Copy</label>
            <p className={styles.description}>
              Prevent copying message content
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSecurity.disableCopy}
              onChange={(e) =>
                handleSecurityChange("disableCopy", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div> */}

        {/* <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Disable Forward</label>
            <p className={styles.description}>Prevent forwarding messages</p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSecurity.disableForward}
              onChange={(e) =>
                handleSecurityChange("disableForward", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div> */}

        {/* <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Disable Download</label>
            <p className={styles.description}>
              Prevent downloading media files
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={chatSecurity.disableDownload}
              onChange={(e) =>
                handleSecurityChange("disableDownload", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div> */}
      </div>

      {/* Two-Factor Authentication */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Two-Factor Authentication</h3>
        <p className={styles.sectionDescription}>
          Add an extra layer of security to your account
        </p>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Two-Factor Authentication</label>
            <p className={styles.description}>
              {twoFactorEnabled
                ? `Enabled via ${twoFactorType || "unknown method"}`
                : "Protect your account with an additional verification step"}
            </p>
          </div>
          <div className={styles.actionButtons}>
            {twoFactorEnabled ? (
              <Button
                variant="secondary"
                onClick={handleDisable2FA}
                disabled={saving}
              >
                Disable 2FA
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setShow2FAModal(true)}
                disabled={saving}
              >
                Enable 2FA
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Change Password</h3>
        <p className={styles.sectionDescription}>
          Update your account password
        </p>

        <form onSubmit={handlePasswordChange} className={styles.passwordForm}>
          <InputBox
            label="Current Password"
            type="password"
            placeholder="Enter your current password"
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                currentPassword: e.target.value,
              })
            }
            required
          />
          <InputBox
            label="New Password"
            type="password"
            placeholder="Enter new password (min. 8 characters)"
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                newPassword: e.target.value,
              })
            }
            required
            minLength={8}
          />
          <InputBox
            label="Confirm New Password"
            type="password"
            placeholder="Confirm your new password"
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                confirmPassword: e.target.value,
              })
            }
            required
            minLength={8}
          />
          <div className={styles.actions}>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      </div>

      {/* Trusted Devices */}
      {trustedDevices.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Trusted Devices</h3>
          <p className={styles.sectionDescription}>
            Devices that don't require 2FA verification
          </p>

          <div className={styles.devicesList}>
            {trustedDevices.map((device, index) => (
              <div key={index} className={styles.deviceItem}>
                <div className={styles.deviceInfo}>
                  <span className={styles.deviceName}>
                    {device.deviceName || "Unknown Device"}
                  </span>
                  <span className={styles.deviceDate}>
                    Trusted on {new Date(device.trustedAt).toLocaleDateString()}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handleRemoveDevice(device.deviceId)}
                  size="small"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {show2FAModal && (
        <TwoFactorModal
          isOpen={show2FAModal}
          onClose={() => setShow2FAModal(false)}
          onSuccess={handle2FASuccess}
        />
      )}
    </div>
  );
}
