"use client";

import Sidebar from "../Sidebar/Sidebar.jsx";
import ChatHeader from "../ChatHeader/ChatHeader.jsx";
import MessageList from "../MessageList/MessageList.jsx";
import MessageInput from "../MessageInput/MessageInput.jsx";
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
  onChatCreated,
  onChatUpdated,
  onChatDeleted,
  typingUsers = [],
  replyTo,
  setReplyTo,
  onTyping,
  onStopTyping,
}) {
  const otherUser = activeChat?.otherUser;

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
            <ChatHeader user={otherUser} chat={activeChat} />
            <MessageList
              messages={messages}
              currentUserId={currentUserId}
              onReply={onReplyMessage}
              onReact={onReactMessage}
              onStar={onStarMessage}
              onPin={onPinMessage}
              onDelete={onDeleteMessage}
              onEdit={onEditMessage}
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
    </div>
  );
}
