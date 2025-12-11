"use client";

import { useState, useEffect, useRef } from "react";
import { useSocket } from "../../hooks/useSocket.js";
import styles from "./SharedNotesEditor.module.css";

export default function SharedNotesEditor({ chatId, groupId, noteId, currentUserId }) {
  const [note, setNote] = useState(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const saveTimeoutRef = useRef(null);
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (noteId) {
      fetchNote();
    } else {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    if (!socket || !connected) return;

    const handleNoteUpdate = (data) => {
      if (data.note && data.note._id === noteId) {
        setNote(data.note);
        setContent(data.note.content || "");
        setTitle(data.note.title || "");
        setIsPinned(data.note.isPinned || false);
      }
    };

    socket.on("notes:update", handleNoteUpdate);

    return () => {
      socket.off("notes:update", handleNoteUpdate);
    };
  }, [socket, connected, noteId]);

  const fetchNote = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/collaboration/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNote(data.note);
        setContent(data.note.content || "");
        setTitle(data.note.title || "");
        setIsPinned(data.note.isPinned || false);
      }
    } catch (error) {
      console.error("Error fetching note:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("accessToken");
      const url = noteId
        ? `/api/collaboration/notes/${noteId}`
        : "/api/collaboration/notes/create";

      const response = await fetch(url, {
        method: noteId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          chatId: chatId || null,
          groupId: groupId || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!noteId) {
          // Navigate to the new note
          window.location.href = `?noteId=${data.note._id}`;
        }
      }
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);

    // Auto-save after 2 seconds of inactivity
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (noteId && title.trim()) {
        handleSave();
      }
    }, 2000);
  };

  const handlePinToggle = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await fetch(`/api/collaboration/notes/${noteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPinned: !isPinned }),
      });
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading note...</div>;
  }

  return (
    <div className={styles.notesEditor}>
      <div className={styles.header}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className={styles.titleInput}
          onBlur={handleSave}
        />
        {noteId && (
          <button
            onClick={handlePinToggle}
            className={`${styles.pinButton} ${isPinned ? styles.pinned : ""}`}
            title={isPinned ? "Unpin note" : "Pin note"}
          >
            📌
          </button>
        )}
        {saving && <span className={styles.saving}>Saving...</span>}
      </div>
      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder="Start typing your note..."
        className={styles.contentArea}
      />
      {note && note.versionHistory && note.versionHistory.length > 0 && (
        <div className={styles.versionInfo}>
          Version {note.currentVersion} • Last edited{" "}
          {new Date(note.updatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

