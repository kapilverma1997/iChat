"use client";

import { useState } from "react";
import Avatar from "../Avatar/Avatar.jsx";
import ReplyPreview from "../ReplyPreview/ReplyPreview.jsx";
import ReactionPicker from "../ReactionPicker/ReactionPicker.jsx";
import ReactionList from "../ReactionList/ReactionList.jsx";
import FilePreview from "../FilePreview/FilePreview.jsx";
import LinkPreview from "../LinkPreview/LinkPreview.jsx";
import { parseMarkdown, extractUrls } from "../../lib/markdown.js";
import styles from "./MessageItem.module.css";

export default function MessageItem({
  message,
  isOwn,
  currentUserId,
  onReply,
  onReact,
  onStar,
  onPin,
  onDelete,
  onEdit,
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      await onEdit(message._id, editContent);
    }
    setIsEditing(false);
  };

  const getReadStatus = () => {
    if (!isOwn) return null;
    const readCount = message.readBy?.length || 0;
    const participantsCount = 2; // For 1:1 chat
    if (readCount >= participantsCount - 1) {
      return "✓✓"; // Double tick - read
    }
    return "✓"; // Single tick - sent
  };

  const renderMessageContent = () => {
    const { type, content, fileUrl, fileName, fileSize, metadata } = message;

    switch (type) {
      case "emoji":
      case "gif":
      case "sticker":
        return (
          <div className={styles.emojiContent}>
            <span className={styles.largeEmoji}>{content}</span>
          </div>
        );

      case "image":
        return (
          <>
            {fileUrl && (
              <FilePreview
                fileUrl={fileUrl}
                fileName={fileName}
                fileSize={fileSize}
                type="image"
              />
            )}
            {content && content.trim() && (
              <div className={styles.text}>{content}</div>
            )}
          </>
        );

      case "video":
        return (
          <>
            {fileUrl && (
              <FilePreview
                fileUrl={fileUrl}
                fileName={fileName}
                fileSize={fileSize}
                type="video"
              />
            )}
            {content && content.trim() && (
              <div className={styles.text}>{content}</div>
            )}
          </>
        );

      case "voice":
      case "audio":
        return (
          <>
            {fileUrl && (
              <div className={styles.audioMessage}>
                <audio src={fileUrl} controls className={styles.audioPlayer} />
                {content && content.trim() && (
                  <div className={styles.text}>{content}</div>
                )}
              </div>
            )}
            {!fileUrl && content && (
              <div className={styles.text}>🎵 Voice message</div>
            )}
          </>
        );

      case "file":
        return (
          <>
            <FilePreview
              fileUrl={fileUrl}
              fileName={fileName}
              fileSize={fileSize}
              type="file"
            />
            {content && content.trim() && (
              <div className={styles.text}>{content}</div>
            )}
          </>
        );

      case "location":
        return (
          <div className={styles.locationMessage}>
            {metadata?.latitude && metadata?.longitude ? (
              <a
                href={`https://www.google.com/maps?q=${metadata.latitude},${metadata.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.locationLink}
              >
                📍 {content || "Location shared"}
                <div className={styles.locationCoords}>
                  {metadata.latitude.toFixed(6)},{" "}
                  {metadata.longitude.toFixed(6)}
                </div>
              </a>
            ) : (
              <div className={styles.text}>
                📍 {content || "Location shared"}
              </div>
            )}
          </div>
        );

      case "contact":
        return (
          <div className={styles.contactMessage}>
            <div className={styles.contactIcon}>👤</div>
            <div className={styles.contactInfo}>
              {metadata?.name && (
                <div className={styles.contactName}>{metadata.name}</div>
              )}
              {metadata?.phone && (
                <div className={styles.contactPhone}>{metadata.phone}</div>
              )}
              {metadata?.email && (
                <div className={styles.contactEmail}>{metadata.email}</div>
              )}
              {content && <div className={styles.text}>{content}</div>}
            </div>
          </div>
        );

      case "code":
        return (
          <div className={styles.codeMessage}>
            <pre className={styles.codeBlock}>
              <code>{content}</code>
            </pre>
            {metadata?.language && (
              <div className={styles.codeLanguage}>{metadata.language}</div>
            )}
          </div>
        );

      case "markdown":
        const urls = extractUrls(content);
        const hasUrls = urls.length > 0;
        const textWithoutUrls = hasUrls
          ? content.replace(/https?:\/\/[^\s]+/g, "").trim()
          : content;

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
        const textUrls = extractUrls(content);
        const hasTextUrls = textUrls.length > 0;
        const textContent = hasTextUrls
          ? content.replace(/https?:\/\/[^\s]+/g, "").trim()
          : content;

        return (
          <>
            {textContent && <div className={styles.text}>{textContent}</div>}
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
        {message.replyTo && (
          <ReplyPreview message={message.replyTo} onClose={() => {}} />
        )}
        {isEditing ? (
          <div className={styles.editContainer}>
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEdit();
                if (e.key === "Escape") {
                  setIsEditing(false);
                  setEditContent(message.content);
                }
              }}
              className={styles.editInput}
              autoFocus
            />
          </div>
        ) : (
          <>
            <div className={styles.bubble}>
              {/* Render based on message type */}
              {renderMessageContent()}

              {/* Reactions */}
              <ReactionList
                reactions={message.reactions}
                currentUserId={currentUserId}
                onReactionClick={(emoji) => onReact(message, emoji)}
              />
            </div>
            <div className={styles.meta}>
              <span className={styles.time}>
                {formatTime(message.createdAt)}
              </span>
              {isOwn && (
                <span className={styles.readStatus}>{getReadStatus()}</span>
              )}
            </div>
          </>
        )}
      </div>
      <div className={styles.actions}>
        <button
          className={styles.actionButton}
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
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
            <button
              onClick={() => {
                setShowReactions(true);
                setShowMenu(false);
              }}
            >
              React
            </button>
            {isOwn && (
              <>
                <button
                  onClick={() => {
                    onStar(message);
                    setShowMenu(false);
                  }}
                >
                  {message.isStarred ? "Unstar" : "Star"}
                </button>
                <button
                  onClick={() => {
                    onPin(message);
                    setShowMenu(false);
                  }}
                >
                  {message.isPinned ? "Unpin" : "Pin"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                >
                  Edit
                </button>
                <button
                  className={styles.delete}
                  onClick={() => {
                    onDelete(message);
                    setShowMenu(false);
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {showReactions && (
        <div style={{ position: "relative" }}>
          <ReactionPicker
            onSelect={(emoji) => {
              onReact(message, emoji);
              setShowReactions(false);
            }}
            position={{ x: 0, y: 0 }}
          />
        </div>
      )}
    </div>
  );
}
