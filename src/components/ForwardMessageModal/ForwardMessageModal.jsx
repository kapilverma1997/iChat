"use client";

import { useState } from "react";
import Modal from "../Modal/Modal.jsx";
import QuotePreview from "../QuotePreview/QuotePreview.jsx";
import styles from "./ForwardMessageModal.module.css";

export default function ForwardMessageModal({
  message,
  chats = [],
  groups = [],
  onForward,
  onClose,
}) {
  const [selectedChats, setSelectedChats] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleChatToggle = (chatId) => {
    setSelectedChats((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleGroupToggle = (groupId) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleForward = async () => {
    for (const chatId of selectedChats) {
      await onForward(message, chatId, null);
    }
    for (const groupId of selectedGroups) {
      await onForward(message, null, groupId);
    }
    onClose();
  };

  const filteredChats = chats.filter((chat) =>
    chat.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal isOpen={true} onClose={onClose} title="Forward Message">
      <div className={styles.forwardModal}>
        <div className={styles.preview}>
          <QuotePreview quotedMessage={message} />
        </div>
        <div className={styles.search}>
          <input
            type="text"
            placeholder="Search chats and groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.lists}>
          {filteredChats.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Chats</h3>
              <div className={styles.list}>
                {filteredChats.map((chat) => (
                  <label key={chat._id} className={styles.item}>
                    <input
                      type="checkbox"
                      checked={selectedChats.includes(chat._id)}
                      onChange={() => handleChatToggle(chat._id)}
                    />
                    <span>{chat.otherUser?.name || "Unknown"}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {filteredGroups.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Groups</h3>
              <div className={styles.list}>
                {filteredGroups.map((group) => (
                  <label key={group._id} className={styles.item}>
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group._id)}
                      onChange={() => handleGroupToggle(group._id)}
                    />
                    <span>{group.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.forwardButton}
            onClick={handleForward}
            disabled={selectedChats.length === 0 && selectedGroups.length === 0}
          >
            Forward ({selectedChats.length + selectedGroups.length})
          </button>
        </div>
      </div>
    </Modal>
  );
}
