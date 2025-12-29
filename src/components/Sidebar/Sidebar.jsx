"use client";

import { useState, useEffect, useRef } from "react";
import ChatListItem from "../ChatListItem/ChatListItem.jsx";
import CreateChatModal from "../CreateChatModal/CreateChatModal.jsx";
import Button from "../Button/Button.jsx";
import styles from "./Sidebar.module.css";

export default function Sidebar({
  chats = [],
  activeChatId,
  onSelectChat,
  onChatCreated,
  onChatUpdated,
  onChatDeleted,
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const resizeHandleRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const isResizingRef = useRef(false);

  const handlePin = async (chat) => {
    await updateChat(chat._id, { isPinned: !chat.isPinned });
  };

  const handleMute = async (chat) => {
    await updateChat(chat._id, { isMuted: !chat.isMuted });
  };

  const handleArchive = async (chat) => {
    if (chat.isArchived) {
      await updateChat(chat._id, { isArchived: false });
    } else {
      await updateChat(chat._id, { isArchived: true });
    }
  };

  const handleMarkUnread = async (chat) => {
    await updateChat(chat._id, { unreadCount: chat.unreadCount + 1 });
  };

  const handleDelete = async (chat) => {
    // This will be handled by parent component with ConfirmationDialog
    onChatDeleted?.(chat);
  };

  const updateChat = async (chatId, updates) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/chat/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatId, ...updates }),
      });

      if (response.ok) {
        const data = await response.json();
        onChatUpdated?.(data.chat);
      }
    } catch (error) {
      console.error("Update chat error:", error);
    }
  };

  const deleteChat = async (chatId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/chat/delete?chatId=${chatId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onChatDeleted?.(chatId);
      }
    } catch (error) {
      console.error("Delete chat error:", error);
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    if (sidebarRef.current) {
      startWidthRef.current = sidebarRef.current.offsetWidth;
    }
  };

  const handleMouseMove = (e) => {
    if (!isResizingRef.current) return;

    const diff = e.clientX - startXRef.current;
    const newWidth = startWidthRef.current + diff;
    const minWidth = 60;
    const maxWidth = 500;

    if (sidebarRef.current) {
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      sidebarRef.current.style.width = `${clampedWidth}px`;

      // Auto-collapse if width is very small
      if (clampedWidth <= minWidth + 20) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    isResizingRef.current = false;
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (sidebarRef.current) {
      if (!isCollapsed) {
        sidebarRef.current.style.width = "60px";
      } else {
        sidebarRef.current.style.width = "350px";
      }
    }
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing]);

  return (
    <div
      ref={sidebarRef}
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
    >
      <div className={styles.header}>
        {!isCollapsed && <h2>Chats</h2>}
        {!isCollapsed && (
          <div className={styles.headerActions}>
            <button
              className={styles.searchButton}
              onClick={() => {
                // Trigger search modal - pass via prop or use event
                if (window.openSearchModal) {
                  window.openSearchModal();
                }
              }}
              title="Search"
            >
              🔍
            </button>
            <Button size="small" onClick={() => setShowCreateModal(true)}>
              New Chat
            </Button>
          </div>
        )}
        {isCollapsed && (
          <Button
            size="small"
            onClick={toggleCollapse}
            className={styles.expandButton}
            title="Expand sidebar"
          >
            →
          </Button>
        )}
      </div>
      <div
        ref={resizeHandleRef}
        className={styles.resizeHandle}
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      />
      <div className={styles.list}>
        {chats
          .sort((a, b) => {
            // Pinned chats first
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // Then sort by lastMessageAt
            const aTime = a.lastMessageAt
              ? new Date(a.lastMessageAt).getTime()
              : 0;
            const bTime = b.lastMessageAt
              ? new Date(b.lastMessageAt).getTime()
              : 0;
            return bTime - aTime;
          })
          .map((chat) => (
            <ChatListItem
              key={chat._id}
              chat={chat}
              isActive={chat._id === activeChatId}
              onClick={() => onSelectChat(chat)}
              onPin={() => handlePin(chat)}
              onMute={() => handleMute(chat)}
              onArchive={() => handleArchive(chat)}
              onMarkUnread={() => handleMarkUnread(chat)}
              onDelete={() => handleDelete(chat)}
            />
          ))}
      </div>
      <CreateChatModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateChat={(chat) => {
          onChatCreated?.(chat);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}
