"use client";

import { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar.jsx";
import ChatHeader from "../ChatHeader/ChatHeader.jsx";
import MessageList from "../MessageList/MessageList.jsx";
import MessageInput from "../MessageInput/MessageInput.jsx";
import NotificationBell from "../NotificationBell/NotificationBell.jsx";
import NotificationCenter from "../NotificationCenter/NotificationCenter.jsx";
import ChatLockScreen from "../ChatLockScreen/ChatLockScreen.jsx";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout({
  chats,
  activeChat,
  messages,
  currentUserId,
  onSelectChat,
  onSendMessage,
  onReplyMessage,
  onReactMessage,
  onStarMessage,
  onPinMessage,
  onDeleteMessage,
  onEditMessage,
  onForwardMessage,
  onChatCreated,
  onChatUpdated,
  onChatDeleted,
  typingUsers = [],
  replyTo,
  setReplyTo,
  onTyping,
  onStopTyping,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [chatLockStatus, setChatLockStatus] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const otherUser = activeChat?.otherUser;

  // Check chat lock status when activeChat changes
  useEffect(() => {
    if (activeChat) {
      checkChatLock();
    } else {
      setIsLocked(false);
      setChatLockStatus(null);
    }
  }, [activeChat]);

  const checkChatLock = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/security/lockChat?chatId=${activeChat?._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsLocked(data.isLocked);
        setChatLockStatus(data);
      }
    } catch (error) {
      console.error("Error checking chat lock:", error);
    }
  };

  const handleUnlock = (dataKey) => {
    setIsLocked(false);
    // Store dataKey for decryption if needed
    if (dataKey) {
      sessionStorage.setItem(`chatKey_${activeChat?._id}`, dataKey);
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        chats={chats}
        activeChatId={activeChat?._id}
        onSelectChat={onSelectChat}
        onChatCreated={onChatCreated}
        onChatUpdated={onChatUpdated}
        onChatDeleted={onChatDeleted}
      />
      <div className={styles.chatArea}>
        {activeChat ? (
          <>
            <div className={styles.chatHeaderWrapper}>
              <ChatHeader user={otherUser} chat={activeChat} />
              <div className={styles.headerActions}>
                <NotificationBell onOpen={() => setShowNotifications(true)} />
              </div>
            </div>
            {isLocked ? (
              <ChatLockScreen
                chatId={activeChat._id}
                lockType={chatLockStatus?.lockType}
                onUnlock={handleUnlock}
              />
            ) : (
              <>
                <MessageList
                  messages={messages}
                  currentUserId={currentUserId}
                  onReply={onReplyMessage}
                  onReact={onReactMessage}
                  onStar={onStarMessage}
                  onPin={onPinMessage}
                  onDelete={onDeleteMessage}
                  onEdit={onEditMessage}
                  onForward={onForwardMessage}
                  typingUsers={typingUsers}
                />
                <MessageInput
                  onSend={onSendMessage}
                  replyTo={replyTo}
                  onCancelReply={() => setReplyTo(null)}
                  onTyping={onTyping}
                  onStopTyping={onStopTyping}
                />
              </>
            )}
          </>
        ) : (
          <div className={styles.emptyStateContent}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h3>Select a conversation</h3>
            <p>Choose a chat from the sidebar to start messaging</p>
          </div>
        )}
      </div>
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}
