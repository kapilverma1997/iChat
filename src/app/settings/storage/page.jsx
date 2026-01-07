"use client";

import { useEffect, useState } from "react";
import Button from "../../../components/Button/Button.jsx";
import styles from "./page.module.css";

export default function CloudStoragePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [storageSettings, setStorageSettings] = useState({
    defaultProvider: "local",
    autoSync: false,
    syncOnUpload: true,
    compressBeforeUpload: false,
  });

  const [connectedProviders, setConnectedProviders] = useState({
    googleDrive: false,
    oneDrive: false,
    dropbox: false,
  });

  const [storageStats, setStorageStats] = useState({
    totalUsed: 0,
    totalAvailable: 0,
    localUsed: 0,
    googleDriveUsed: 0,
    oneDriveUsed: 0,
    dropboxUsed: 0,
  });

  useEffect(() => {
    fetchStorageData();
  }, []);

  const fetchStorageData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/storage/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStorageSettings({
          defaultProvider: data.settings?.defaultProvider || "local",
          autoSync: data.settings?.autoSync || false,
          syncOnUpload: data.settings?.syncOnUpload ?? true,
          compressBeforeUpload: data.settings?.compressBeforeUpload || false,
        });
        setConnectedProviders({
          googleDrive: data.connectedProviders?.googleDrive || false,
          oneDrive: data.connectedProviders?.oneDrive || false,
          dropbox: data.connectedProviders?.dropbox || false,
        });
        setStorageStats({
          totalUsed: data.stats?.totalUsed || 0,
          totalAvailable: data.stats?.totalAvailable || 0,
          localUsed: data.stats?.localUsed || 0,
          googleDriveUsed: data.stats?.googleDriveUsed || 0,
          oneDriveUsed: data.stats?.oneDriveUsed || 0,
          dropboxUsed: data.stats?.dropboxUsed || 0,
        });
      } else {
        // If API doesn't exist yet, use defaults
        console.log("Storage API not available, using defaults");
      }
    } catch (error) {
      console.error("Error fetching storage data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key, value) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const updatedSettings = { ...storageSettings, [key]: value };

      const response = await fetch("/api/storage/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          settings: updatedSettings,
        }),
      });

      if (response.ok) {
        setStorageSettings(updatedSettings);
        setSuccess("Storage settings updated successfully");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update storage settings");
      }
    } catch (error) {
      setError(error.message || "Failed to update storage settings");
    } finally {
      setSaving(false);
    }
  };

  const handleConnectProvider = async (provider) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/storage/connect/${provider}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to OAuth URL if provided
        if (data.authUrl) {
          window.location.href = data.authUrl;
        } else {
          setConnectedProviders({
            ...connectedProviders,
            [provider]: true,
          });
          setSuccess(`${provider} connected successfully`);
          fetchStorageData();
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || `Failed to connect ${provider}`);
      }
    } catch (error) {
      setError(error.message || `Failed to connect ${provider}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectProvider = async (provider) => {
    if (
      !confirm(
        `Are you sure you want to disconnect ${provider}? This will stop syncing files to this provider.`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/storage/disconnect/${provider}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setConnectedProviders({
          ...connectedProviders,
          [provider]: false,
        });
        setSuccess(`${provider} disconnected successfully`);
        fetchStorageData();
      } else {
        const data = await response.json();
        throw new Error(data.error || `Failed to disconnect ${provider}`);
      }
    } catch (error) {
      setError(error.message || `Failed to disconnect ${provider}`);
    } finally {
      setSaving(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getStoragePercentage = () => {
    if (storageStats.totalAvailable === 0) return 0;
    return Math.round(
      (storageStats.totalUsed / storageStats.totalAvailable) * 100
    );
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const providers = [
    {
      id: "googleDrive",
      name: "Google Drive",
      icon: "📁",
      description: "Store and sync files with Google Drive",
      connected: connectedProviders.googleDrive,
      used: storageStats.googleDriveUsed,
    },
    {
      id: "oneDrive",
      name: "OneDrive",
      icon: "☁️",
      description: "Store and sync files with Microsoft OneDrive",
      connected: connectedProviders.oneDrive,
      used: storageStats.oneDriveUsed,
    },
    {
      id: "dropbox",
      name: "Dropbox",
      icon: "📦",
      description: "Store and sync files with Dropbox",
      connected: connectedProviders.dropbox,
      used: storageStats.dropboxUsed,
    },
  ];

  return (
    <div className={styles.cloudStorage}>
      <h2 className={styles.title}>Cloud Storage</h2>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {/* Storage Overview */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Storage Overview</h3>
        <p className={styles.sectionDescription}>
          View your storage usage across all providers
        </p>

        <div className={styles.storageOverview}>
          <div className={styles.storageInfo}>
            <div className={styles.storageLabel}>Total Storage Used</div>
            <div className={styles.storageValue}>
              {formatBytes(storageStats.totalUsed)} /{" "}
              {formatBytes(storageStats.totalAvailable)}
            </div>
            <div className={styles.storageBar}>
              <div
                className={styles.storageBarFill}
                style={{ width: `${getStoragePercentage()}%` }}
              ></div>
            </div>
            <div className={styles.storagePercentage}>
              {getStoragePercentage()}% used
            </div>
          </div>

          <div className={styles.storageBreakdown}>
            <div className={styles.storageItem}>
              <span className={styles.storageItemLabel}>Local Storage</span>
              <span className={styles.storageItemValue}>
                {formatBytes(storageStats.localUsed)}
              </span>
            </div>
            {connectedProviders.googleDrive && (
              <div className={styles.storageItem}>
                <span className={styles.storageItemLabel}>Google Drive</span>
                <span className={styles.storageItemValue}>
                  {formatBytes(storageStats.googleDriveUsed)}
                </span>
              </div>
            )}
            {connectedProviders.oneDrive && (
              <div className={styles.storageItem}>
                <span className={styles.storageItemLabel}>OneDrive</span>
                <span className={styles.storageItemValue}>
                  {formatBytes(storageStats.oneDriveUsed)}
                </span>
              </div>
            )}
            {connectedProviders.dropbox && (
              <div className={styles.storageItem}>
                <span className={styles.storageItemLabel}>Dropbox</span>
                <span className={styles.storageItemValue}>
                  {formatBytes(storageStats.dropboxUsed)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connected Providers */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Cloud Storage Providers</h3>
        <p className={styles.sectionDescription}>
          Connect your cloud storage accounts to sync files automatically
        </p>

        <div className={styles.providersList}>
          {providers.map((provider) => (
            <div key={provider.id} className={styles.providerItem}>
              <div className={styles.providerInfo}>
                <div className={styles.providerIcon}>{provider.icon}</div>
                <div className={styles.providerDetails}>
                  <div className={styles.providerName}>{provider.name}</div>
                  <div className={styles.providerDescription}>
                    {provider.description}
                  </div>
                  {provider.connected && provider.used > 0 && (
                    <div className={styles.providerUsage}>
                      {formatBytes(provider.used)} used
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.providerActions}>
                {provider.connected ? (
                  <>
                    <span className={styles.connectedBadge}>Connected</span>
                    <Button
                      variant="secondary"
                      onClick={() => handleDisconnectProvider(provider.id)}
                      disabled={saving}
                      size="small"
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => handleConnectProvider(provider.id)}
                    disabled={saving}
                    size="small"
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Storage Settings */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Storage Settings</h3>
        <p className={styles.sectionDescription}>
          Configure how files are stored and synced
        </p>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Default Storage Provider</label>
            <p className={styles.description}>
              Choose where new files are stored by default
            </p>
          </div>
          <select
            className={styles.select}
            value={storageSettings.defaultProvider}
            onChange={(e) =>
              handleSettingChange("defaultProvider", e.target.value)
            }
            disabled={saving}
          >
            <option value="local">Local Storage</option>
            {connectedProviders.googleDrive && (
              <option value="googleDrive">Google Drive</option>
            )}
            {connectedProviders.oneDrive && (
              <option value="oneDrive">OneDrive</option>
            )}
            {connectedProviders.dropbox && (
              <option value="dropbox">Dropbox</option>
            )}
          </select>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Auto Sync</label>
            <p className={styles.description}>
              Automatically sync files to connected cloud storage providers
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={storageSettings.autoSync}
              onChange={(e) =>
                handleSettingChange("autoSync", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Sync on Upload</label>
            <p className={styles.description}>
              Automatically sync files to cloud storage when uploaded
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={storageSettings.syncOnUpload}
              onChange={(e) =>
                handleSettingChange("syncOnUpload", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>Compress Before Upload</label>
            <p className={styles.description}>
              Compress images and files before uploading to save storage space
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={storageSettings.compressBeforeUpload}
              onChange={(e) =>
                handleSettingChange("compressBeforeUpload", e.target.checked)
              }
              disabled={saving}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>
    </div>
  );
}

