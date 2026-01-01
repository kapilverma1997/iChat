"use client";

import { useState, useEffect, useRef } from "react";
import Avatar from "../Avatar/Avatar.jsx";
import ReplyPreview from "../ReplyPreview/ReplyPreview.jsx";
import QuotePreview from "../QuotePreview/QuotePreview.jsx";
import PriorityLabel from "../PriorityLabel/PriorityLabel.jsx";
import ReactionPicker from "../ReactionPicker/ReactionPicker.jsx";
import ReactionList from "../ReactionList/ReactionList.jsx";
import FilePreview from "../FilePreview/FilePreview.jsx";
import LinkPreview from "../LinkPreview/LinkPreview.jsx";
import MessageActionsMenu from "../MessageActionsMenu/MessageActionsMenu.jsx";
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
  onDeleteForEveryone,
  onEdit,
  onForward,
  onQuote,
  onSetPriority,
  onAddTag,
  onRemoveTag,
  onSchedule,
  onRemind,
  onTranslate,
  isSelected = false,
  onSelect,
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const menuRef = useRef(null);
  const actionsRef = useRef(null);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEdit = async () => {
    // Check if message has been read by recipient (for own messages)
    if (isOwn) {
      const readCount = message.readBy?.length || 0;
      const participantsCount = 2; // For 1:1 chat
      if (readCount >= participantsCount - 1) {
        alert("Cannot edit message that has been read by the recipient.");
        setIsEditing(false);
        setEditContent(message.content);
        return;
      }
    }

    if (editContent.trim() && editContent !== message.content) {
      await onEdit(message._id, editContent);
    }
    setIsEditing(false);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    const button = e.currentTarget;
    const buttonRect = button.getBoundingClientRect();

    // Use viewport coordinates for fixed positioning
    const menuWidth = 200; // Approximate menu width
    const menuItemHeight = 40; // Approximate height per menu item
    const padding = 8; // Menu padding (4px top + 4px bottom)

    // Estimate menu height based on menu items
    // Count menu items based on isOwn
    let menuItemCount = 1; // Forward (always shown)
    if (!isOwn) {
      menuItemCount += 2; // Quote + Delete for Me
    } else {
      menuItemCount += 8; // Edit + Priority + Tag + Schedule + Remind + Translate + Delete for Me + Delete for Everyone
    }
    const estimatedMenuHeight = menuItemCount * menuItemHeight + padding;

    // Calculate available space
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;

    // Determine vertical position
    let y;
    let openUpward = false;
    if (spaceBelow >= estimatedMenuHeight + 4) {
      // Enough space below, position below button
      y = buttonRect.bottom + 4;
    } else if (spaceAbove >= estimatedMenuHeight + 4) {
      // Not enough space below, but enough above, position above button
      y = buttonRect.top - estimatedMenuHeight - 4;
      openUpward = true;
    } else {
      // Not enough space in either direction, use the side with more space
      if (spaceBelow > spaceAbove) {
        y = buttonRect.bottom + 4;
      } else {
        y = buttonRect.top - estimatedMenuHeight - 4;
        openUpward = true;
      }
    }

    // Calculate horizontal position with overflow protection
    const viewportWidth = window.innerWidth;
    let x;
    if (isOwn) {
      // For own messages, align right edge of menu with right edge of button
      x = buttonRect.right - menuWidth;
      // Check if menu would overflow on the left
      if (x < 8) {
        x = 8; // Add some margin from viewport edge
      }
    } else {
      // For other messages, align left edge of menu with left edge of button
      x = buttonRect.left;
      // Check if menu would overflow on the right
      if (x + menuWidth > viewportWidth - 8) {
        x = viewportWidth - menuWidth - 8; // Add some margin from viewport edge
      }
    }

    setMenuPosition({ x, y, useFixed: true, openUpward });
    setShowMenu(!showMenu);
  };

  // Adjust menu position after render to handle actual menu height
  useEffect(() => {
    if (showMenu && menuRef.current && actionsRef.current) {
      // The menu element is the first child of the wrapper div
      const menuElement = menuRef.current.firstElementChild;
      if (menuElement) {
        // Use requestAnimationFrame to ensure the menu is fully rendered
        requestAnimationFrame(() => {
          const menuRect = menuElement.getBoundingClientRect();
          const buttonRect = actionsRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;

          // Get current position from the menu element's computed style
          const currentX = menuRect.left;
          const currentY = menuRect.top;

          // Check if menu overflows viewport
          let needsReposition = false;
          let newX = currentX;
          let newY = currentY;

          // Check vertical overflow
          if (menuRect.bottom > viewportHeight - 8) {
            // Menu overflows bottom, try to position above
            const spaceAbove = buttonRect.top;
            if (spaceAbove >= menuRect.height + 4) {
              newY = buttonRect.top - menuRect.height - 4;
              needsReposition = true;
            } else {
              // Not enough space above, constrain to viewport
              newY = viewportHeight - menuRect.height - 8;
              needsReposition = true;
            }
          } else if (menuRect.top < 8) {
            // Menu overflows top, constrain to viewport
            newY = 8;
            needsReposition = true;
          }

          // Check horizontal overflow
          if (menuRect.right > viewportWidth - 8) {
            newX = viewportWidth - menuRect.width - 8;
            needsReposition = true;
          } else if (menuRect.left < 8) {
            newX = 8;
            needsReposition = true;
          }

          if (needsReposition) {
            setMenuPosition((prev) => ({ ...prev, x: newX, y: newY }));
          }
        });
      }
    }
  }, [showMenu]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showMenu &&
        menuRef.current &&
        actionsRef.current &&
        !menuRef.current.contains(event.target) &&
        !actionsRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showMenu]);

  const handleMessageClick = (e) => {
    // Only handle multi-select if clicking on the message bubble, not on buttons
    if (
      (e.shiftKey || e.ctrlKey || e.metaKey) &&
      !e.target.closest(`.${styles.actions}`) &&
      !e.target.closest(`.${styles.actionButton}`)
    ) {
      e.preventDefault();
      onSelect?.(message._id?.toString());
    }
  };

  const getReadStatus = () => {
    if (!isOwn) return null;
    const readCount = message.readBy?.length || 0;
    const participantsCount = 2; // For 1:1 chat
    const isRead = readCount >= participantsCount - 1;
    return {
      text: isRead ? "✓✓" : "✓",
      isRead: isRead
    };
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
          <div className={styles.audioMessage}>
            {fileUrl ? (
              <audio 
                src={fileUrl} 
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
            {content && content.trim() && content !== "Voice message" && (
              <div className={styles.audioCaption}>{content}</div>
            )}
          </div>
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

  // Check if message is deleted for this user
  const isDeletedForMe =
    message.deletedFor?.some(
      (id) => id.toString() === currentUserId?.toString()
    ) || false;
  const isDeletedForEveryone = message.isDeletedForEveryone || false;
  const showDeletedMessage = isDeletedForMe || isDeletedForEveryone;

  return (
    <div
      className={`${styles.message} ${isOwn ? styles.own : ""} ${
        isSelected ? styles.selected : ""
      } ${showDeletedMessage ? styles.deleted : ""}`}
      onClick={handleMessageClick}
    >
      {!isOwn && (
        <Avatar
          src={message.senderId?.profilePhoto}
          name={message.senderId?.name}
          size="small"
        />
      )}
      <div className={styles.content}>
        {message.forwardedFrom && (
          <div className={styles.forwardedLabel}>
            ↪ Forwarded from {message.forwardedFrom.chatId ? "chat" : "group"}
          </div>
        )}
        {message.quotedMessage && (
          <QuotePreview quotedMessage={message.quotedMessage} />
        )}
        {message.replyTo && (
          <ReplyPreview message={message.replyTo} onClose={() => {}} />
        )}
        {message.priority && message.priority !== "normal" && (
          <PriorityLabel priority={message.priority} />
        )}
        {message.tags && message.tags.length > 0 && (
          <div className={styles.tags}>
            {message.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
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
              {message.edited && (
                <span className={styles.editedLabel}>(edited)</span>
              )}
              {isOwn && (() => {
                const readStatus = getReadStatus();
                if (!readStatus) return null;
                return (
                  <span className={`${styles.readStatus} ${readStatus.isRead ? styles.read : styles.sent}`}>
                    {readStatus.text}
                  </span>
                );
              })()}
            </div>
          </>
        )}
      </div>
      <div className={styles.actions} ref={actionsRef}>
        <button className={styles.actionButton} onClick={handleMenuClick}>
          ⋮
        </button>
        {showMenu && (
          <div ref={menuRef}>
            <MessageActionsMenu
              message={message}
              isOwn={isOwn}
              onEdit={(msg) => {
                // Check if message has been read by recipient (for own messages)
                if (isOwn) {
                  const readCount = msg.readBy?.length || 0;
                  const participantsCount = 2; // For 1:1 chat
                  if (readCount >= participantsCount - 1) {
                    alert(
                      "Cannot edit message that has been read by the recipient."
                    );
                    setShowMenu(false);
                    return;
                  }
                }
                setIsEditing(true);
                setShowMenu(false);
              }}
              onDelete={(msg, forEveryone) => {
                onDelete?.(msg, forEveryone);
              }}
              onDeleteForEveryone={(msg) => {
                onDeleteForEveryone?.(msg);
              }}
              onForward={(msg) => {
                onForward?.(msg);
              }}
              onQuote={(msg) => {
                onQuote?.(msg);
              }}
              onSetPriority={(messageId, priority) => {
                onSetPriority?.(messageId, priority);
              }}
              onAddTag={(messageId, tag) => {
                onAddTag?.(messageId, tag);
              }}
              onRemoveTag={(messageId, tag) => {
                onRemoveTag?.(messageId, tag);
              }}
              onSchedule={(msg) => {
                onSchedule?.(msg);
              }}
              onRemind={(msg) => {
                onRemind?.(msg);
              }}
              onTranslate={(msg) => {
                onTranslate?.(msg);
              }}
              position={menuPosition}
              onClose={() => setShowMenu(false)}
            />
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
