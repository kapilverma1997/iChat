"use client";

import { useState, useRef, useEffect } from "react";
import ReplyPreview from "../ReplyPreview/ReplyPreview.jsx";
import EmojiPicker from "../EmojiPicker/EmojiPicker.jsx";
import VoiceRecorder from "../VoiceRecorder/VoiceRecorder.jsx";
import CameraCapture from "../CameraCapture/CameraCapture.jsx";
import FilePreview from "../FilePreview/FilePreview.jsx";
import ContactShareModal from "../ContactShareModal/ContactShareModal.jsx";
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const [formattingMode, setFormattingMode] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const typingTimeoutRef = useRef(null);
  const errorTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // File size limits (in bytes) - matching backend limits
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB for videos
  const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB for images
  const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB for audio

  const canSend = hasPermission(userRole, "canSendMessage");
  const isReadOnly =
    group.settings?.readOnly && !hasPermission(userRole, "canChangeGroupInfo");

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to show error message
  const showError = (message) => {
    setErrorMessage(message);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => {
      setErrorMessage(null);
    }, 5000);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setContent(value);

    // Detect @mentions - match @ followed by word characters (letters, numbers, underscore)
    // This will match @username, @john, etc.
    const mentionRegex = /@(\w+)/g;
    const matches = [...value.matchAll(mentionRegex)];
    const newMentions = [];
    
    // Process each match
    matches.forEach((match) => {
      const username = match[1].toLowerCase();
      // Skip @everyone as it's handled separately
      if (username !== "everyone") {
        newMentions.push({
          type: "user",
          username: match[1], // Keep original case for display
        });
      }
    });

    // Detect @everyone (case-insensitive)
    if (/\@everyone\b/i.test(value)) {
      // Remove any duplicate user mentions if @everyone is present
      newMentions.length = 0;
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
          socket.emit("groupStopTyping", {
            groupId: group._id,
            userId: "current",
          });
        }
      }, 1000);
    }
  };

  const handleFileSend = async (file, type = null, metadata = {}, fileContent = null) => {
    if (!group?._id) {
      console.error("Group ID is required for file upload");
      showError("Group ID is required for file upload");
      return;
    }

    // Validate file size before sending
    if (file.size > MAX_FILE_SIZE) {
      showError("File size exceeds maximum limit of 500MB");
      return;
    }

    // Check specific file type limits
    if (file.type.startsWith("image/") && file.size > MAX_IMAGE_SIZE) {
      showError("Image size exceeds maximum limit of 50MB");
      return;
    } else if (file.type.startsWith("video/") && file.size > MAX_VIDEO_SIZE) {
      showError(
        "Video size exceeds maximum limit of 200MB. Please compress your video or use a smaller file."
      );
      return;
    } else if (file.type.startsWith("audio/") && file.size > MAX_AUDIO_SIZE) {
      showError("Audio size exceeds maximum limit of 100MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("groupId", group._id);
    if (type) formData.append("type", type);
    if (replyTo?._id) formData.append("replyTo", replyTo._id);
    if (metadata && Object.keys(metadata).length > 0) {
      formData.append("metadata", JSON.stringify(metadata));
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const fileUrl = data.file.url;
        const fileName = data.file.metadata.name;
        const fileSize = data.file.metadata.size;

        // Determine message type
        let messageType = type || "file";
        if (!type || type === "file") {
          if (file.type.startsWith("image/")) {
            messageType = "image";
          } else if (file.type.startsWith("video/")) {
            messageType = "video";
          } else if (file.type.startsWith("audio/")) {
            messageType = "audio";
          } else {
            messageType = "file";
          }
        }

        // Process mentions for file messages
        const processedMentions = processMentions();
        const result = await onSend(fileContent || content || "", replyTo?._id, messageType, {
          fileUrl,
          fileName,
          fileSize,
          metadata: data.file.metadata || {},
          mentions: processedMentions,
        });
        
        // Check if onSend returned an error
        if (result && !result.success && result.error) {
          showError(result.error);
          return; // Stop processing, don't throw
        }
        return data;
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to upload file" }));
        const errorMsg =
          errorData.error || `Failed to upload file (${response.status})`;
        showError(errorMsg);
        console.error("Error uploading file:", errorMsg);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showError("Failed to upload file. Please try again.");
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    // Validate file sizes before adding
    const validFiles = [];
    for (const file of files) {
      // Check general file size limit
      if (file.size > MAX_FILE_SIZE) {
        showError(`File "${file.name}" exceeds maximum limit of 500MB`);
        continue;
      }

      // Check specific file type limits
      if (file.type.startsWith("image/") && file.size > MAX_IMAGE_SIZE) {
        showError(`Image "${file.name}" exceeds maximum limit of 50MB`);
        continue;
      } else if (file.type.startsWith("video/") && file.size > MAX_VIDEO_SIZE) {
        showError(
          `Video "${file.name}" exceeds maximum limit of 200MB. Please compress your video or use a smaller file.`
        );
        continue;
      } else if (file.type.startsWith("audio/") && file.size > MAX_AUDIO_SIZE) {
        showError(`Audio "${file.name}" exceeds maximum limit of 100MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
    e.target.value = ""; // Reset input
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Convert mentions from usernames to userIds
  const processMentions = () => {
    if (!mentions.length || !group?.members) return [];

    const processedMentions = [];
    const addedUserIds = new Set(); // Track added userIds to avoid duplicates
    
    for (const mention of mentions) {
      if (mention.type === "everyone") {
        processedMentions.push({ type: "everyone" });
      } else if (mention.type === "user" && mention.username) {
        // Find user by name - try exact match first, then partial match
        const usernameLower = mention.username.toLowerCase();
        let member = group.members.find((m) => {
          const memberName = (m.userId?.name || "").toLowerCase();
          // Try exact match first
          return memberName === usernameLower;
        });
        
        // If no exact match, try partial match (starts with)
        if (!member) {
          member = group.members.find((m) => {
            const memberName = (m.userId?.name || "").toLowerCase();
            return memberName.startsWith(usernameLower) || memberName.includes(usernameLower);
          });
        }
        
        if (member && member.userId?._id) {
          const userIdStr = member.userId._id.toString();
          // Avoid duplicates
          if (!addedUserIds.has(userIdStr)) {
            addedUserIds.add(userIdStr);
            processedMentions.push({
              type: "user",
              userId: member.userId._id,
            });
          }
        }
      }
    }
    
    return processedMentions;
  };

  const handleSend = async (messageType = "text", additionalData = {}) => {
    if (!canSend || isReadOnly) return;

    const messageContent = additionalData?.content?.trim() || content.trim();

    // Don't send if no content and no files (allow contact and location messages)
    if (
      !messageContent &&
      selectedFiles.length === 0 &&
      !additionalData.file &&
      !additionalData.content &&
      messageType !== "contact" &&
      messageType !== "location"
    ) {
      return;
    }

    // Process mentions: convert usernames to userIds
    const processedMentions = processMentions();

    // Clear input immediately for instant feedback
    const contentToSend = messageContent;
    const filesToSend = [...selectedFiles];
    setContent("");
    setIsCodeMode(false);
    setIsMarkdownMode(false);
    setSelectedFiles([]);
    setMentions([]);
    if (replyTo) {
      onCancelReply?.();
    }
    if (socket && group?._id) {
      socket.emit("groupStopTyping", { groupId: group._id, userId: "current" });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send emoji message
    if (messageType === "emoji" && additionalData.content) {
      const result = await onSend(additionalData.content, replyTo?._id, "emoji", {
        ...additionalData,
        mentions: processedMentions,
      });
      if (result && !result.success && result.error) {
        showError(result.error);
      }
    }
    // Send contact message
    else if (messageType === "contact") {
      const result = await onSend(additionalData.content || "", replyTo?._id, "contact", {
        ...additionalData,
        mentions: processedMentions,
      });
      if (result && !result.success && result.error) {
        showError(result.error);
      }
    }
    // Send location message
    else if (messageType === "location") {
      const result = await onSend(additionalData.content || "", replyTo?._id, "location", {
        ...additionalData,
        mentions: processedMentions,
      });
      if (result && !result.success && result.error) {
        showError(result.error);
      }
    }
    // Send text message
    else if (contentToSend && messageType === "text") {
      const finalType = isCodeMode
        ? "code"
        : isMarkdownMode
        ? "markdown"
        : "text";
      const result = await onSend(contentToSend, replyTo?._id, finalType, {
        ...additionalData,
        mentions: processedMentions,
      });
      if (result && !result.success && result.error) {
        showError(result.error);
      }
    }

    // Send file messages
    if (filesToSend.length > 0) {
      for (const file of filesToSend) {
        await handleFileSend(file, null, {}, contentToSend || "");
        // Error already displayed in handleFileSend if it occurred
      }
    }

    // Send voice/camera files
    if (additionalData.file) {
      await handleFileSend(
        additionalData.file,
        messageType,
        additionalData.metadata
      );
      // Error already displayed in handleFileSend if it occurred
    }
  };

  const handleVoiceRecordingComplete = async (audioBlob) => {
    setShowVoiceRecorder(false);
    await handleSend("voice", { file: audioBlob });
  };

  const handleCameraCapture = async (blob, mode) => {
    setShowCamera(false);
    const type = mode === "photo" ? "image" : "video";
    await handleSend(type, { file: blob });
  };

  const handleLocationShare = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await handleSend("location", {
            metadata: { latitude, longitude },
            content: "Location shared",
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          showError("Could not access location. Please check permissions.");
        }
      );
    } else {
      showError("Geolocation is not supported by your browser.");
    }
  };

  const handleContactShare = () => {
    setShowContactModal(true);
  };

  const handleContactShareSubmit = (contactData) => {
    handleSend("contact", {
      metadata: {
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
      },
      content: contactData.name,
    });
  };

  const handleEmojiSelect = (emoji) => {
    // Check if it's a single emoji (send as emoji message) or add to text
    if (!content.trim() && emoji.length <= 2) {
      // Single emoji - send as emoji message
      handleSend("emoji", { content: emoji });
    } else {
      // Add to text
      setContent((prev) => prev + emoji);
      inputRef.current?.focus();
    }
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applyFormatting = (format) => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let formattedText = "";
    let cursorOffset = 0;

    switch (format) {
      case "bold":
        if (selectedText) {
          formattedText = `**${selectedText}**`;
          cursorOffset = formattedText.length;
        } else {
          formattedText = `****`;
          cursorOffset = 2;
        }
        break;
      case "italic":
        if (selectedText) {
          formattedText = `*${selectedText}*`;
          cursorOffset = formattedText.length;
        } else {
          formattedText = `**`;
          cursorOffset = 1;
        }
        break;
      case "underline":
        if (selectedText) {
          formattedText = `__${selectedText}__`;
          cursorOffset = formattedText.length;
        } else {
          formattedText = `____`;
          cursorOffset = 2;
        }
        break;
      default:
        formattedText = selectedText;
        cursorOffset = formattedText.length;
    }

    const newContent =
      content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);

    // Set cursor position after React updates the DOM
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + cursorOffset;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);

    // Reset formatting mode after applying
    setFormattingMode(null);
  };

  if (!canSend || isReadOnly) {
    return (
      <div className={styles.readOnly}>
        {isReadOnly
          ? "Group is in read-only mode"
          : "You do not have permission to send messages"}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {replyTo && <ReplyPreview message={replyTo} onClose={onCancelReply} />}

      {/* Error message */}
      {errorMessage && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>✗</span>
          <span className={styles.errorText}>{errorMessage}</span>
          <button
            className={styles.errorClose}
            onClick={() => {
              setErrorMessage(null);
              if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
              }
            }}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {/* File previews */}
      {selectedFiles.length > 0 && (
        <div className={styles.filePreviews}>
          {selectedFiles.map((file, index) => (
            <FilePreview
              key={index}
              fileUrl={URL.createObjectURL(file)}
              fileName={file.name}
              fileSize={file.size}
              type={
                file.type.startsWith("image/")
                  ? "image"
                  : file.type.startsWith("video/")
                  ? "video"
                  : "file"
              }
              onRemove={() => handleRemoveFile(index)}
            />
          ))}
        </div>
      )}

      {/* Voice recorder */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onRecordingComplete={handleVoiceRecordingComplete}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Camera capture */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}

      {/* Contact share modal */}
      <ContactShareModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        onShare={handleContactShareSubmit}
      />

      <div className={styles.inputContainer}>
        <div className={styles.toolbar}>
          <button
            className={styles.toolbarButton}
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <button
            className={styles.toolbarButton}
            onClick={() => setShowCamera(true)}
            title="Camera"
          >
            📷
          </button>
          <button
            className={styles.toolbarButton}
            onClick={() => setShowVoiceRecorder(true)}
            title="Voice message"
          >
            🎤
          </button>
          <button
            className={styles.toolbarButton}
            onClick={handleLocationShare}
            title="Share location"
          >
            📍
          </button>
          <button
            className={styles.toolbarButton}
            onClick={handleContactShare}
            title="Share contact"
          >
            👤
          </button>
          <button
            className={`${styles.toolbarButton} ${
              isCodeMode ? styles.active : ""
            }`}
            onClick={() => {
              setIsCodeMode(!isCodeMode);
              setIsMarkdownMode(false);
            }}
            title="Code block"
          >
            {"</>"}
          </button>
          <button
            className={`${styles.toolbarButton} ${
              isMarkdownMode ? styles.active : ""
            }`}
            onClick={() => {
              setIsMarkdownMode(!isMarkdownMode);
              setIsCodeMode(false);
            }}
            title="Markdown"
          >
            M↓
          </button>
          <div className={styles.divider}></div>
          <button
            className={`${styles.toolbarButton} ${
              formattingMode === "bold" ? styles.active : ""
            }`}
            onClick={() => {
              applyFormatting("bold");
              setFormattingMode("bold");
            }}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            className={`${styles.toolbarButton} ${
              formattingMode === "italic" ? styles.active : ""
            }`}
            onClick={() => {
              applyFormatting("italic");
              setFormattingMode("italic");
            }}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            className={`${styles.toolbarButton} ${
              formattingMode === "underline" ? styles.active : ""
            }`}
            onClick={() => {
              applyFormatting("underline");
              setFormattingMode("underline");
            }}
            title="Underline"
          >
            <u>U</u>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        />

        <button
          className={styles.emojiButton}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Emoji"
        >
          😊
        </button>

        <textarea
          ref={inputRef}
          className={styles.input}
          value={content}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={
            isCodeMode
              ? "Enter code..."
              : isMarkdownMode
              ? "Type markdown..."
              : "Type a message... Use @username to mention"
          }
          rows={1}
        />

        <button
          className={styles.sendButton}
          onClick={() => handleSend()}
          disabled={!content.trim() && selectedFiles.length === 0}
        >
          Send
        </button>
      </div>

      {showEmojiPicker && (
        <EmojiPicker
          onSelect={handleEmojiSelect}
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
}
