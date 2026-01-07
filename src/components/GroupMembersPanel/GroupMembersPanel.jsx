"use client";

import { useState, useEffect } from "react";
import Avatar from "../Avatar/Avatar.jsx";
import Button from "../Button/Button.jsx";
import Modal from "../Modal/Modal.jsx";
import InputBox from "../InputBox/InputBox.jsx";
import { getMemberRole, hasPermission } from "../../../lib/groupPermissions.js";
import styles from "./GroupMembersPanel.module.css";

export default function GroupMembersPanel({ group, currentUserId, userRole, onClose, onRefresh }) {
  const [members, setMembers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (group) {
      setMembers(group.members || []);
      setJoinRequests(group.joinRequests?.filter(req => req.status === "pending") || []);
    }
  }, [group]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await response.json();

      // Find user by email
      const userResponse = await fetch(`/api/user/search?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userResponse.ok) {
        throw new Error("User not found");
      }

      const targetUser = await userResponse.json();

      const addResponse = await fetch("/api/groups/add-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId: group._id,
          userId: targetUser._id,
        }),
      });

      const data = await addResponse.json();
      if (!addResponse.ok) {
        throw new Error(data.error || "Failed to add member");
      }

      setEmail("");
      setShowAddMember(false);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/groups/remove-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId: group._id,
          userId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove member");
      }

      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePromote = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/groups/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId: group._id,
          userId,
          newRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role");
      }

      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveRequest = async (requestId, approve) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/groups/approve-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId: group._id,
          requestId,
          approve,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to process request");
      }

      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      owner: "👑 Owner",
      admin: "⭐ Admin",
      moderator: "🛡️ Moderator",
      member: "👤 Member",
      "read-only": "👁️ Read-only",
    };
    return badges[role] || role;
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Group Members">
      <div className={styles.panel}>
        {hasPermission(userRole, "canAddMembers") && (
          <div className={styles.actions}>
            <Button onClick={() => setShowAddMember(true)} size="small">
              + Add Member
            </Button>
          </div>
        )}

        {joinRequests.length > 0 && hasPermission(userRole, "canAddMembers") && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Join Requests ({joinRequests.length})</h3>
            {joinRequests.map((request) => (
              <div key={request._id} className={styles.requestItem}>
                <Avatar
                  src={request.userId?.profilePhoto}
                  name={request.userId?.name}
                  size="small"
                />
                <div className={styles.requestInfo}>
                  <div className={styles.requestName}>{request.userId?.name}</div>
                  <div className={styles.requestEmail}>{request.userId?.email}</div>
                </div>
                <div className={styles.requestActions}>
                  <Button
                    size="small"
                    variant="primary"
                    onClick={() => handleApproveRequest(request._id, true)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => handleApproveRequest(request._id, false)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Members ({members.length})</h3>
          <div className={styles.membersList}>
            {members.map((member) => (
              <div key={member.userId._id || member.userId} className={styles.memberItem}>
                {(() => {
                  // Check privacy settings for profile photo
                  const privacySettings = member.userId?.privacySettings || {};
                  const showProfilePhoto = privacySettings.showProfilePhoto !== false; // Default to true if not set
                  const profilePhotoSrc = showProfilePhoto ? member.userId?.profilePhoto : null;
                  
                  // Check chat settings for online status visibility
                  const chatSettings = member.userId?.chatSettings || {};
                  const showOnlineStatus = chatSettings.showOnlineStatus !== false; // Default to true if not set
                  
                  return (
                    <Avatar
                      src={profilePhotoSrc}
                      name={member.userId?.name}
                      size="medium"
                      status={showOnlineStatus ? member.userId?.presenceStatus : null}
                    />
                  );
                })()}
                <div className={styles.memberInfo}>
                  <div className={styles.memberName}>
                    {member.userId?.name || "Unknown"}
                    {member.userId?._id?.toString() === currentUserId?.toString() && (
                      <span className={styles.you}> (You)</span>
                    )}
                  </div>
                  <div className={styles.memberRole}>{getRoleBadge(member.role)}</div>
                </div>
                <div className={styles.memberActions}>
                  {hasPermission(userRole, "canManageRoles") &&
                    member.userId?._id?.toString() !== currentUserId?.toString() && (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handlePromote(member.userId._id || member.userId, e.target.value)
                        }
                        className={styles.roleSelect}
                      >
                        <option value="member">Member</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                        {userRole === "owner" && <option value="owner">Owner</option>}
                      </select>
                    )}
                  {hasPermission(userRole, "canRemoveMembers") &&
                    member.userId?._id?.toString() !== currentUserId?.toString() &&
                    member.role !== "owner" && (
                      <button
                        className={styles.removeButton}
                        onClick={() =>
                          handleRemoveMember(member.userId._id || member.userId)
                        }
                      >
                        Remove
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {showAddMember && (
          <Modal
            isOpen={showAddMember}
            onClose={() => {
              setShowAddMember(false);
              setEmail("");
              setError("");
            }}
            title="Add Member"
          >
            <form onSubmit={handleAddMember} className={styles.addForm}>
              <div className={styles.field}>
                <label htmlFor="email">User Email</label>
                <InputBox
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter user email"
                  required
                  disabled={loading}
                />
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.actions}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAddMember(false);
                    setEmail("");
                    setError("");
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Member"}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </Modal>
  );
}

