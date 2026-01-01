"use client";

import { useState } from "react";
import Avatar from "../Avatar/Avatar.jsx";
import ReplyPreview from "../ReplyPreview/ReplyPreview.jsx";
import ReactionList from "../ReactionList/ReactionList.jsx";
import PollDisplay from "../PollDisplay/PollDisplay.jsx";
import LinkPreview from "../LinkPreview/LinkPreview.jsx";
import { canDeleteMessage } from "../../../lib/groupPermissions.js";
import { parseMarkdown, extractUrls } from "../../lib/markdown.js";
import styles from "./GroupMessageItem.module.css";

export default function GroupMessageItem({
  message,
  currentUserId,
  userRole,
  group,
  onReply,
  onReact,
  onDelete,
  onThreadClick,
  onPollVoteUpdate,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isOwn = message.senderId?._id?.toString() === currentUserId?.toString();
  const canDelete = canDeleteMessage(
    group,
    userRole,
    message.senderId?._id || message.senderId,
    currentUserId
  );
  const threadCount = message.threadCount || 0;

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderContent = () => {
    if (message.isDeleted) {
      return <div className={styles.deleted}>This message was deleted</div>;
    }

    switch (message.type) {
      case "image":
        return (
          <>
            {message.fileUrl && (
              <img
                src={message.fileUrl}
                alt={message.fileName}
                className={styles.image}
              />
            )}
            {message.content && message.content.trim() && (
              <div
                className={styles.text}
                dangerouslySetInnerHTML={{
                  __html: parseMarkdown(message.content),
                }}
              />
            )}
          </>
        );
      case "video":
        return (
          <>
            {message.fileUrl && (
              <video src={message.fileUrl} controls className={styles.video} />
            )}
            {message.content && message.content.trim() && (
              <div
                className={styles.text}
                dangerouslySetInnerHTML={{
                  __html: parseMarkdown(message.content),
                }}
              />
            )}
          </>
        );
      case "file":
        return (
          <div className={styles.file}>
            <a href={message.fileUrl} download={message.fileName}>
              📎 {message.fileName} ({(message.fileSize / 1024).toFixed(2)} KB)
            </a>
            {message.content && message.content.trim() && (
              <div
                className={styles.text}
                dangerouslySetInnerHTML={{
                  __html: parseMarkdown(message.content),
                }}
              />
            )}
          </div>
        );
      case "voice":
      case "audio":
        return (
          <div className={styles.audioMessage}>
            {message.fileUrl ? (
              <audio
                src={message.fileUrl}
                controls
                preload="metadata"
                className={styles.audioPlayer}
              />
            ) : (
              <div className={styles.audioPlaceholder}>
                <span className={styles.audioIcon}>🎤</span>
                <span>Voice message</span>
              </div>
            )}
            {message.content &&
              message.content.trim() &&
              message.content !== "Voice message" && (
                <div className={styles.audioCaption}>{message.content}</div>
              )}
          </div>
        );
      case "poll":
        return (
          <PollDisplay
            poll={message.poll}
            currentUserId={currentUserId}
            onVoteUpdate={(updatedPoll) => {
              // Update the poll in the message immediately for instant feedback
              // Socket events will also update it for real-time sync across clients
              if (updatedPoll && onPollVoteUpdate) {
                onPollVoteUpdate(message._id, updatedPoll);
              }
            }}
          />
        );
      case "event":
        return <div className={styles.event}>📅 Event: {message.content}</div>;
      case "location":
        return (
          <div className={styles.locationMessage}>
            {message.metadata?.latitude && message.metadata?.longitude ? (
              <a
                href={`https://www.google.com/maps?q=${message.metadata.latitude},${message.metadata.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.locationLink}
              >
                📍 {message.content || "Location shared"}
                <div className={styles.locationCoords}>
                  {message.metadata.latitude.toFixed(6)},{" "}
                  {message.metadata.longitude.toFixed(6)}
                </div>
              </a>
            ) : (
              <div className={styles.text}>
                📍 {message.content || "Location shared"}
              </div>
            )}
          </div>
        );
      case "contact":
        return (
          <div className={styles.contactMessage}>
            <div className={styles.contactIcon}>👤</div>
            <div className={styles.contactInfo}>
              {message.metadata?.name && (
                <div className={styles.contactName}>
                  {message.metadata.name}
                </div>
              )}
              {message.metadata?.phone && (
                <div className={styles.contactPhone}>
                  {message.metadata.phone}
                </div>
              )}
              {message.metadata?.email && (
                <div className={styles.contactEmail}>
                  {message.metadata.email}
                </div>
              )}
            </div>
          </div>
        );
      case "code":
        return (
          <div className={styles.codeMessage}>
            <pre className={styles.codeBlock}>
              <code>{message.content}</code>
            </pre>
            {message.metadata?.language && (
              <div className={styles.codeLanguage}>
                {message.metadata.language}
              </div>
            )}
          </div>
        );
      case "markdown":
        const urls = extractUrls(message.content || "");
        const textWithoutUrls =
          urls.length > 0
            ? message.content.replace(/https?:\/\/[^\s]+/g, "").trim()
            : message.content;

        return (
          <div className={styles.markdownMessage}>
            {textWithoutUrls && (
              <div
                className={styles.markdownContent}
                dangerouslySetInnerHTML={{
                  __html: parseMarkdown(textWithoutUrls),
                }}
              />
            )}
            {urls.map((url, index) => (
              <LinkPreview key={index} url={url} />
            ))}
          </div>
        );
      case "text":
      default:
        const textUrls = extractUrls(message.content || "");
        const hasTextUrls = textUrls.length > 0;
        const textContent = hasTextUrls
          ? message.content.replace(/https?:\/\/[^\s]+/g, "").trim()
          : message.content;

        return (
          <>
            {textContent && (
              <div
                className={styles.text}
                dangerouslySetInnerHTML={{
                  __html: parseMarkdown(textContent),
                }}
              />
            )}
            {textUrls.map((url, index) => (
              <LinkPreview key={index} url={url} />
            ))}
          </>
        );
    }
  };

  return (
    <div className={`${styles.message} ${isOwn ? styles.own : ""}`}>
      {!isOwn && (
        <Avatar
          src={message.senderId?.profilePhoto}
          name={message.senderId?.name}
          size="small"
        />
      )}
      <div className={styles.content}>
        {!isOwn && (
          <div className={styles.senderName}>{message.senderId?.name}</div>
        )}
        {message.replyTo && (
          <ReplyPreview message={message.replyTo} onClose={() => {}} />
        )}
        <div className={styles.bubble}>
          {renderContent()}
          {message.reactions && message.reactions.length > 0 && (
            <ReactionList
              reactions={message.reactions}
              currentUserId={currentUserId}
              onReactionClick={(emoji) => onReact(message, emoji)}
            />
          )}
        </div>
        <div className={styles.meta}>
          <span className={styles.time}>{formatTime(message.createdAt)}</span>
          {threadCount > 0 && (
            <button
              className={styles.threadButton}
              onClick={() => onThreadClick(message)}
            >
              {threadCount} reply{threadCount > 1 ? "ies" : ""}
            </button>
          )}
        </div>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.actionButton}
          onClick={() => setShowMenu(!showMenu)}
        >
          ⋮
        </button>
        {showMenu && (
          <div className={styles.menu}>
            <button
              onClick={() => {
                onReply(message);
                setShowMenu(false);
              }}
            >
              Reply
            </button>
            {group.settings?.allowReplies && (
              <button
                onClick={() => {
                  onThreadClick(message);
                  setShowMenu(false);
                }}
              >
                View Thread
              </button>
            )}
            {canDelete && (
              <button
                className={styles.delete}
                onClick={() => {
                  onDelete(message);
                  setShowMenu(false);
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
