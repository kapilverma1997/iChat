"use client";

import { useState, useEffect } from "react";
import { useSocket } from "../../hooks/useSocket.js";
import styles from "./DraftIndicator.module.css";

export default function DraftIndicator({ chatId, groupId }) {
  const [draft, setDraft] = useState(null);
  const { socket, connected } = useSocket();

  useEffect(() => {
    fetchDraft();
  }, [chatId, groupId]);

  useEffect(() => {
    if (!socket || !connected) return;

    const handleDraftUpdate = (data) => {
      if (
        (data.draft?.chatId?.toString() === chatId?.toString() ||
          data.draft?.groupId?.toString() === groupId?.toString()) &&
        data.action === "saved"
      ) {
        setDraft(data.draft);
      } else if (data.action === "deleted") {
        setDraft(null);
      }
    };

    socket.on("draft:update", handleDraftUpdate);

    return () => {
      socket.off("draft:update", handleDraftUpdate);
    };
  }, [socket, connected, chatId, groupId]);

  const fetchDraft = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const params = new URLSearchParams();
      if (chatId) params.append("chatId", chatId);
      if (groupId) params.append("groupId", groupId);

      const response = await fetch(`/api/collaboration/drafts/get?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.draft && data.draft.content) {
          setDraft(data.draft);
        } else {
          setDraft(null);
        }
      }
    } catch (error) {
      console.error("Error fetching draft:", error);
    }
  };

  const handleRestoreDraft = () => {
    if (draft && draft.content) {
      // Emit event to restore draft in message input
      window.dispatchEvent(
        new CustomEvent("restoreDraft", { detail: draft })
      );
    }
  };

  const handleDiscardDraft = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await fetch("/api/collaboration/drafts/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setDraft(null);
    } catch (error) {
      console.error("Error deleting draft:", error);
    }
  };

  if (!draft || !draft.content) {
    return null;
  }

  return (
    <div className={styles.draftIndicator}>
      <div className={styles.draftContent}>
        <span className={styles.draftIcon}>💾</span>
        <span className={styles.draftText}>
          Draft saved {new Date(draft.lastSavedAt).toLocaleTimeString()}
        </span>
      </div>
      <div className={styles.draftActions}>
        <button onClick={handleRestoreDraft} className={styles.restoreButton}>
          Restore
        </button>
        <button onClick={handleDiscardDraft} className={styles.discardButton}>
          Discard
        </button>
      </div>
    </div>
  );
}

