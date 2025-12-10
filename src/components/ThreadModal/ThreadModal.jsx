"use client";

import { useState, useEffect } from "react";
import Modal from "../Modal/Modal.jsx";
import GroupMessageItem from "../GroupMessageItem/GroupMessageItem.jsx";
import GroupMessageInput from "../GroupMessageInput/GroupMessageInput.jsx";
import styles from "./ThreadModal.module.css";

export default function ThreadModal({ isOpen, onClose, parentMessage, group, currentUserId, userRole }) {
  const [threadMessages, setThreadMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && parentMessage?._id) {
      loadThreadMessages();
    }
  }, [isOpen, parentMessage?._id]);

  const loadThreadMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/groups/messages/list?groupId=${group._id}&threadId=${parentMessage._id}`
      , {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setThreadMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error loading thread messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendThreadReply = async (content, replyToId, type, fileData) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/groups/messages/thread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId: group._id,
          parentMessageId: parentMessage._id,
          content,
          type: type || "text",
          fileUrl: fileData?.fileUrl || "",
          fileName: fileData?.fileName || "",
          fileSize: fileData?.fileSize || 0,
          metadata: fileData?.metadata || {},
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setThreadMessages((prev) => [...prev, data.threadMessage]);
        loadThreadMessages();
      }
    } catch (error) {
      console.error("Error sending thread reply:", error);
    }
  };

  if (!parentMessage) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thread Replies">
      <div className={styles.container}>
        <div className={styles.parentMessage}>
          <GroupMessageItem
            message={parentMessage}
            currentUserId={currentUserId}
            userRole={userRole}
            group={group}
            onReply={() => {}}
            onReact={() => {}}
            onDelete={() => {}}
            onThreadClick={() => {}}
          />
        </div>
        <div className={styles.threadMessages}>
          {loading ? (
            <div className={styles.loading}>Loading replies...</div>
          ) : threadMessages.length === 0 ? (
            <div className={styles.empty}>No replies yet</div>
          ) : (
            threadMessages.map((message) => (
              <GroupMessageItem
                key={message._id}
                message={message}
                currentUserId={currentUserId}
                userRole={userRole}
                group={group}
                onReply={() => {}}
                onReact={() => {}}
                onDelete={() => {}}
                onThreadClick={() => {}}
              />
            ))
          )}
        </div>
        <div className={styles.input}>
          <GroupMessageInput
            group={group}
            userRole={userRole}
            replyTo={null}
            onSend={handleSendThreadReply}
            onCancelReply={() => {}}
            socket={null}
          />
        </div>
      </div>
    </Modal>
  );
}

