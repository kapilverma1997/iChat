"use client";

import { useState } from "react";
import Modal from "../Modal/Modal.jsx";
import InputBox from "../InputBox/InputBox.jsx";
import Button from "../Button/Button.jsx";
import { hasPermission } from "../../../lib/groupPermissions.js";
import styles from "./GroupSettingsPanel.module.css";

export default function GroupSettingsPanel({
  group,
  userRole,
  onClose,
  onRefresh,
}) {
  const [formData, setFormData] = useState({
    name: group.name || "",
    description: group.description || "",
    welcomeMessage: group.welcomeMessage || "",
    groupPhoto: group.groupPhoto || "",
    groupType: group.groupType || "public",
    onlyAdminsSendFiles: group.settings?.onlyAdminsSendFiles || false,
    onlyAdminsCreatePolls: group.settings?.onlyAdminsCreatePolls || false,
    onlyAdminsChangeInfo: group.settings?.onlyAdminsChangeInfo || false,
    allowReactions:
      group.settings?.allowReactions !== undefined
        ? group.settings.allowReactions
        : true,
    allowReplies:
      group.settings?.allowReplies !== undefined
        ? group.settings.allowReplies
        : true,
    muted: group.settings?.muted || false,
    readOnly: group.settings?.readOnly || false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canChangeInfo = hasPermission(userRole, "canChangeGroupInfo");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/groups/${group._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          welcomeMessage: formData.welcomeMessage,
          groupPhoto: formData.groupPhoto,
          groupType: formData.groupType,
          settings: {
            onlyAdminsSendFiles: formData.onlyAdminsSendFiles,
            onlyAdminsCreatePolls: formData.onlyAdminsCreatePolls,
            onlyAdminsChangeInfo: formData.onlyAdminsChangeInfo,
            allowReactions: formData.allowReactions,
            allowReplies: formData.allowReplies,
            muted: formData.muted,
            readOnly: formData.readOnly,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update group");
      }

      onRefresh();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Group Settings"
      className={styles.wideModal}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.twoColumnLayout}>
          {/* Left Column - Group Information */}
          <div className={styles.leftColumn}>
            {canChangeInfo ? (
              <>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    <span className={styles.icon}>📝</span>
                    Group Information
                  </h3>
                  <div className={styles.fieldsContainer}>
                    <div className={styles.field}>
                      <label htmlFor="name">Group Name *</label>
                      <InputBox
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
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
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        disabled={loading}
                      />
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="groupType">Group Type</label>
                      <select
                        id="groupType"
                        value={formData.groupType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            groupType: e.target.value,
                          })
                        }
                        disabled={loading}
                        className={styles.select}
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="announcement">Announcement</option>
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="welcomeMessage">Welcome Message</label>
                      <InputBox
                        id="welcomeMessage"
                        type="textarea"
                        value={formData.welcomeMessage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            welcomeMessage: e.target.value,
                          })
                        }
                        disabled={loading}
                      />
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="groupPhoto">Group Photo URL</label>
                      <InputBox
                        id="groupPhoto"
                        type="url"
                        value={formData.groupPhoto}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            groupPhoto: e.target.value,
                          })
                        }
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.noPermission}>
                <span className={styles.warningIcon}>⚠️</span>
                You do not have permission to change group information.
              </div>
            )}
          </div>

          {/* Right Column - Settings */}
          <div className={styles.rightColumn}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.icon}>⚙️</span>
                Group Settings
              </h3>
              <div className={styles.settingsContainer}>
                <div className={styles.checkboxList}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.onlyAdminsSendFiles}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          onlyAdminsSendFiles: e.target.checked,
                        })
                      }
                      disabled={loading || !canChangeInfo}
                    />
                    <span className={styles.checkboxLabel}>
                      Only admins can send files
                    </span>
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.onlyAdminsCreatePolls}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          onlyAdminsCreatePolls: e.target.checked,
                        })
                      }
                      disabled={loading || !canChangeInfo}
                    />
                    <span className={styles.checkboxLabel}>
                      Only admins can create polls
                    </span>
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.onlyAdminsChangeInfo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          onlyAdminsChangeInfo: e.target.checked,
                        })
                      }
                      disabled={loading || !canChangeInfo}
                    />
                    <span className={styles.checkboxLabel}>
                      Only admins can change group info
                    </span>
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.allowReactions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allowReactions: e.target.checked,
                        })
                      }
                      disabled={loading || !canChangeInfo}
                    />
                    <span className={styles.checkboxLabel}>
                      Allow message reactions
                    </span>
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.allowReplies}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allowReplies: e.target.checked,
                        })
                      }
                      disabled={loading || !canChangeInfo}
                    />
                    <span className={styles.checkboxLabel}>
                      Allow message replies
                    </span>
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.muted}
                      onChange={(e) =>
                        setFormData({ ...formData, muted: e.target.checked })
                      }
                      disabled={loading}
                    />
                    <span className={styles.checkboxLabel}>
                      Muted (for you)
                    </span>
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.readOnly}
                      onChange={(e) =>
                        setFormData({ ...formData, readOnly: e.target.checked })
                      }
                      disabled={loading || !canChangeInfo}
                    />
                    <span className={styles.checkboxLabel}>Read-only mode</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          {canChangeInfo && (
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
