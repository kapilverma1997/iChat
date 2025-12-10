"use client";

import { useState } from "react";
import Modal from "../Modal/Modal.jsx";
import styles from "./EditMessageModal.module.css";

export default function EditMessageModal({ message, onSave, onClose }) {
  const [content, setContent] = useState(message?.content || "");

  const handleSave = async () => {
    if (content.trim() && content !== message.content) {
      await onSave(message._id, content);
    }
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Message">
      <div className={styles.editModal}>
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Edit your message..."
          autoFocus
          rows={4}
        />
        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}

