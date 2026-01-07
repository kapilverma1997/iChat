"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import GroupMessageItem from "../GroupMessageItem/GroupMessageItem.jsx";
import GroupMessageInput from "../GroupMessageInput/GroupMessageInput.jsx";
import PinnedMessageBar from "../PinnedMessageBar/PinnedMessageBar.jsx";
import EventDetailsModal from "../EventDetailsModal/EventDetailsModal.jsx";
import MultiSelectBar from "../MultiSelectBar/MultiSelectBar.jsx";
import ConfirmationDialog from "../ConfirmationDialog/ConfirmationDialog.jsx";
import { useSocket } from "../../hooks/useSocket.js";
import styles from "./GroupMessageArea.module.css";

export default function GroupMessageArea({ group, currentUserId, userRole }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showThread, setShowThread] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { socket, connected } = useSocket();
  const messagesEndRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/groups/messages/list?groupId=${group._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  }, [group?._id]);

  const handleNewMessage = useCallback(
    (data) => {
      if (data.groupId === group._id) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const messageId =
            data.groupMessage._id?.toString() || data.groupMessage._id;
          const exists = prev.some(
            (msg) => (msg._id?.toString() || msg._id) === messageId
          );
          if (exists) {
            return prev;
          }
          return [...prev, data.groupMessage];
        });
      }
    },
    [group?._id]
  );

  const handleThreadMessage = useCallback(
    (data) => {
      if (data.groupId === group._id) {
        // Update thread count on parent message
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.threadMessage.threadId
              ? { ...msg, threadCount: (msg.threadCount || 0) + 1 }
              : msg
          )
        );
      }
    },
    [group?._id]
  );

  const handleTyping = useCallback(
    ({ userId, groupId: typingGroupId }) => {
      if (typingGroupId === group._id && userId !== currentUserId) {
        setTypingUsers((prev) => {
          if (!prev.includes(userId)) {
            return [...prev, userId];
          }
          return prev;
        });
      }
    },
    [group?._id, currentUserId]
  );

  const handleStopTyping = useCallback(
    ({ userId, groupId: typingGroupId }) => {
      if (typingGroupId === group._id) {
        setTypingUsers((prev) => prev.filter((id) => id !== userId));
      }
    },
    [group?._id]
  );

  const handlePollVote = useCallback(
    (data) => {
      if (data.groupId === group._id && data.poll) {
        // Update the poll data in the corresponding message
        setMessages((prev) =>
          prev.map((msg) => {
            const pollId = msg.poll?._id?.toString() || msg.poll?._id;
            const dataPollId = data.pollId?.toString() || data.pollId;
            return msg.type === "poll" && pollId === dataPollId
              ? { ...msg, poll: data.poll }
              : msg;
          })
        );
      }
    },
    [group?._id]
  );

  const handlePollCreate = useCallback(
    (data) => {
      if (data.groupId === group._id && data.pollMessage) {
        // Add the new poll message to the list
        setMessages((prev) => [
          ...prev,
          { ...data.pollMessage, poll: data.poll },
        ]);
      }
    },
    [group?._id]
  );

  const handleEventCreate = useCallback(
    (data) => {
      if (data.groupId === group._id && data.eventMessage) {
        // Add the new event message to the list with event data attached
        const eventMessageWithEvent = {
          ...data.eventMessage,
          event: data.event, // Attach the event data to the message
        };
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const messageId =
            eventMessageWithEvent._id?.toString() || eventMessageWithEvent._id;
          const exists = prev.some(
            (msg) => (msg._id?.toString() || msg._id) === messageId
          );
          if (exists) {
            return prev;
          }
          return [...prev, eventMessageWithEvent];
        });
      }
    },
    [group?._id]
  );

  const handlePollVoteUpdate = useCallback((messageId, updatedPoll) => {
    // Update the poll in the message immediately for instant feedback
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId && msg.type === "poll"
          ? { ...msg, poll: updatedPoll }
          : msg
      )
    );
  }, []);

  const handleEventUpdate = useCallback((messageId, updatedEvent) => {
    // Update the event in the message immediately for instant feedback
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId && msg.type === "event"
          ? { ...msg, event: updatedEvent }
          : msg
      )
    );
    // Also update selected event if it's the same event
    if (selectedEvent && selectedEvent._id === updatedEvent._id) {
      setSelectedEvent(updatedEvent);
    }
  }, [selectedEvent]);

  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  useEffect(() => {
    if (group?._id) {
      loadMessages();
      // Clear selection when group changes
      setSelectedMessages(new Set());
      if (socket && connected) {
        socket.emit("joinGroup", group._id);
        socket.on("group:message", handleNewMessage);
        socket.on("group:threadMessage", handleThreadMessage);
        socket.on("groupTyping", handleTyping);
        socket.on("groupStopTyping", handleStopTyping);
        socket.on("group:pollVote", handlePollVote);
        socket.on("group:pollCreate", handlePollCreate);
        socket.on("group:eventCreate", handleEventCreate);
      }
    }

    return () => {
      if (socket && connected && group?._id) {
        socket.emit("leaveGroup", group._id);
        socket.off("group:message");
        socket.off("group:threadMessage");
        socket.off("groupTyping");
        socket.off("groupStopTyping");
        socket.off("group:pollVote");
        socket.off("group:pollCreate");
        socket.off("group:eventCreate");
      }
    };
  }, [
    group?._id,
    socket,
    connected,
    loadMessages,
    handleNewMessage,
    handleThreadMessage,
    handleTyping,
    handleStopTyping,
    handlePollVote,
    handlePollCreate,
    handleEventCreate,
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content, replyToId, type, fileData) => {
    try {
      const token = localStorage.getItem("accessToken");
      console.log(content, replyToId, type, fileData);
      const response = await fetch("/api/groups/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId: group._id,
          content,
          type: type || "text",
          replyTo: replyToId,
          fileUrl: fileData?.fileUrl || "",
          fileName: fileData?.fileName || "",
          fileSize: fileData?.fileSize || 0,
          metadata: fileData?.metadata || {},
          mentions: fileData?.mentions || [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const messageId =
            data.groupMessage._id?.toString() || data.groupMessage._id;
          const exists = prev.some(
            (msg) => (msg._id?.toString() || msg._id) === messageId
          );
          if (exists) {
            // Update existing message instead of adding duplicate
            return prev.map((msg) =>
              (msg._id?.toString() || msg._id) === messageId
                ? data.groupMessage
                : msg
            );
          }
          return [...prev, data.groupMessage];
        });
        setReplyTo(null);
        return { success: true };
      } else {
        // Handle error response - return error instead of throwing
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to send message" }));
        const errorMsg =
          errorData.error || `Failed to send message (${response.status})`;
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      // Only log network/parsing errors, don't throw
      const errorMsg = error.message || "Failed to send message";
      return { success: false, error: errorMsg };
    }
  };

  const handleReact = async (message, emoji) => {
    // Implement reaction logic
    console.log("React to message:", message._id, emoji);
  };

  const handleDelete = async (message) => {
    setDeleteConfirm({
      type: "message",
      id: message._id,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await fetch("/api/groups/messages/delete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ messageId: message._id }),
          });

          if (response.ok) {
            setMessages((prev) => prev.filter((msg) => msg._id !== message._id));
          }
        } catch (error) {
          console.error("Error deleting message:", error);
        } finally {
          setDeleteConfirm(null);
        }
      },
    });
  };

  const handleSelectMessage = (messageId) => {
    setSelectedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleClearSelection = () => {
    setSelectedMessages(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedMessages.size === 0) return;

    setDeleteConfirm({
      type: "messages",
      count: selectedMessages.size,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const messageIds = Array.from(selectedMessages);

          // Delete messages one by one
          const deletePromises = messageIds.map((messageId) =>
            fetch("/api/groups/messages/delete", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ messageId }),
            })
          );

          await Promise.all(deletePromises);

          // Update local state
          setMessages((prev) =>
            prev.filter(
              (msg) => !selectedMessages.has(msg._id?.toString())
            )
          );

          setSelectedMessages(new Set());
          loadMessages(); // Refresh messages
        } catch (error) {
          console.error("Error deleting messages:", error);
        } finally {
          setDeleteConfirm(null);
        }
      },
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const pinnedMessages = group.pinnedMessages || [];

  return (
    <div className={styles.container}>
      {pinnedMessages.length > 0 && (
        <PinnedMessageBar pinnedMessages={pinnedMessages} onClose={() => {}} />
      )}
      {selectedMessages && selectedMessages.size > 0 && (
        <MultiSelectBar
          selectedCount={selectedMessages.size}
          onDelete={handleBulkDelete}
          onClear={handleClearSelection}
        />
      )}
      <div className={styles.messages}>
        {loading ? (
          <div className={styles.loading}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className={styles.empty}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <GroupMessageItem
                key={message._id}
                message={message}
                currentUserId={currentUserId}
                userRole={userRole}
                group={group}
                onReply={setReplyTo}
                onReact={handleReact}
                onDelete={handleDelete}
                onThreadClick={setShowThread}
                onPollVoteUpdate={handlePollVoteUpdate}
                onEventUpdate={handleEventUpdate}
                onEventClick={handleEventClick}
                isSelected={selectedMessages.has(message._id?.toString())}
                onSelect={handleSelectMessage}
              />
            ))}
            {typingUsers.length > 0 && (
              <div className={styles.typing}>
                {typingUsers.length} user{typingUsers.length > 1 ? "s" : ""}{" "}
                typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <GroupMessageInput
        group={group}
        userRole={userRole}
        replyTo={replyTo}
        onSend={handleSendMessage}
        onCancelReply={() => setReplyTo(null)}
        socket={socket}
      />
      {deleteConfirm && (
        <ConfirmationDialog
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={deleteConfirm.onConfirm}
          title={
            deleteConfirm.type === "messages" ? "Delete Messages" : "Delete Message"
          }
          message={
            deleteConfirm.type === "messages"
              ? `Are you sure you want to delete ${deleteConfirm.count} ${
                  deleteConfirm.count === 1 ? "message" : "messages"
                }? This action cannot be undone.`
              : "Are you sure you want to delete this message? This action cannot be undone."
          }
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}
