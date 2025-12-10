"use client";

import { useState } from "react";
import Modal from "../Modal/Modal.jsx";
import InputBox from "../InputBox/InputBox.jsx";
import Button from "../Button/Button.jsx";
import styles from "./CreateGroupModal.module.css";

export default function CreateGroupModal({ isOpen, onClose, onCreateGroup }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    groupType: "public",
    welcomeMessage: "",
    groupPhoto: "",
    onlyAdminsSendFiles: false,
    onlyAdminsCreatePolls: false,
    onlyAdminsChangeInfo: false,
    allowReactions: true,
    allowReplies: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/groups/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          groupType: formData.groupType,
          welcomeMessage: formData.welcomeMessage,
          groupPhoto: formData.groupPhoto,
          settings: {
            onlyAdminsSendFiles: formData.onlyAdminsSendFiles,
            onlyAdminsCreatePolls: formData.onlyAdminsCreatePolls,
            onlyAdminsChangeInfo: formData.onlyAdminsChangeInfo,
            allowReactions: formData.allowReactions,
            allowReplies: formData.allowReplies,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create group");
      }

      onCreateGroup(data.group);
      setFormData({
        name: "",
        description: "",
        groupType: "public",
        welcomeMessage: "",
        groupPhoto: "",
        onlyAdminsSendFiles: false,
        onlyAdminsCreatePolls: false,
        onlyAdminsChangeInfo: false,
        allowReactions: true,
        allowReplies: true,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Group">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="name">Group Name *</label>
          <InputBox
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter group name"
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
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Enter group description"
            disabled={loading}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="groupType">Group Type</label>
          <select
            id="groupType"
            value={formData.groupType}
            onChange={(e) =>
              setFormData({ ...formData, groupType: e.target.value })
            }
            disabled={loading}
            className={styles.select}
          >
            <option value="public">Public (Anyone can join)</option>
            <option value="private">Private (Invite only)</option>
            <option value="announcement">Announcement (Admin only)</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="welcomeMessage">Welcome Message</label>
          <InputBox
            id="welcomeMessage"
            type="textarea"
            value={formData.welcomeMessage}
            onChange={(e) =>
              setFormData({ ...formData, welcomeMessage: e.target.value })
            }
            placeholder="Welcome message for new members"
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
              setFormData({ ...formData, groupPhoto: e.target.value })
            }
            placeholder="https://example.com/photo.jpg"
            disabled={loading}
          />
        </div>

        <div className={styles.settings}>
          <h3>Group Settings</h3>
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
              disabled={loading}
            />
            Only admins can send files
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
              disabled={loading}
            />
            Only admins can create polls
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
              disabled={loading}
            />
            Only admins can change group info
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={formData.allowReactions}
              onChange={(e) =>
                setFormData({ ...formData, allowReactions: e.target.checked })
              }
              disabled={loading}
            />
            Allow message reactions
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={formData.allowReplies}
              onChange={(e) =>
                setFormData({ ...formData, allowReplies: e.target.checked })
              }
              disabled={loading}
            />
            Allow message replies
          </label>
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
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

