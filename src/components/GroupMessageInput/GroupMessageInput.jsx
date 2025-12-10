"use client";

import { useState, useRef, useEffect } from "react";
import ReplyPreview from "../ReplyPreview/ReplyPreview.jsx";
import InputBox from "../InputBox/InputBox.jsx";
import Button from "../Button/Button.jsx";
import { hasPermission } from "../../../lib/groupPermissions.js";
import styles from "./GroupMessageInput.module.css";

export default function GroupMessageInput({
  group,
  userRole,
  replyTo,
  onSend,
  onCancelReply,
  socket,
}) {
  const [content, setContent] = useState("");
  const [mentions, setMentions] = useState([]);
  const typingTimeoutRef = useRef(null);

  const canSend = hasPermission(userRole, "canSendMessage");
  const isReadOnly = group.settings?.readOnly && !hasPermission(userRole, "canChangeGroupInfo");

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setContent(value);

    // Detect @mentions
    const mentionRegex = /@(\w+)/g;
    const matches = [...value.matchAll(mentionRegex)];
    const newMentions = matches.map((match) => ({
      type: "user",
      username: match[1],
    }));

    // Detect @everyone
    if (value.includes("@everyone")) {
      newMentions.push({ type: "everyone" });
    }

    setMentions(newMentions);

    // Typing indicator
    if (socket && group?._id) {
      socket.emit("groupTyping", { groupId: group._id, userId: "current" });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (socket && group?._id) {
          socket.emit("groupStopTyping", { groupId: group._id, userId: "current" });
        }
      }, 1000);
    }
  };

  const handleSend = async () => {
    if (!content.trim() || !canSend || isReadOnly) return;

    await onSend(content, replyTo?._id, "text", {});
    setContent("");
    setMentions([]);
    if (socket && group?._id) {
      socket.emit("groupStopTyping", { groupId: group._id, userId: "current" });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!canSend || isReadOnly) {
    return (
      <div className={styles.readOnly}>
        {isReadOnly ? "Group is in read-only mode" : "You do not have permission to send messages"}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {replyTo && (
        <ReplyPreview message={replyTo} onClose={onCancelReply} />
      )}
      <div className={styles.inputContainer}>
        <InputBox
          type="textarea"
          multiline={true}
          value={content}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message... Use @username to mention"
          disabled={!canSend || isReadOnly}
          rows={1}
        />
        <Button onClick={handleSend} disabled={!content.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}

