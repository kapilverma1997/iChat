"use client";

import { useState, useRef, useEffect } from "react";
import ReplyPreview from "../ReplyPreview/ReplyPreview.jsx";
import QuotePreview from "../QuotePreview/QuotePreview.jsx";
import EmojiPicker from "../EmojiPicker/EmojiPicker.jsx";
import StickerPicker from "../StickerPicker/StickerPicker.jsx";
import GifPicker from "../GifPicker/GifPicker.jsx";
import VoiceRecorder from "../VoiceRecorder/VoiceRecorder.jsx";
import CameraCapture from "../CameraCapture/CameraCapture.jsx";
import FilePreview from "../FilePreview/FilePreview.jsx";
import ContactShareModal from "../ContactShareModal/ContactShareModal.jsx";
import styles from "./MessageInput.module.css";

export default function MessageInput({
  onSend,
  replyTo,
  onCancelReply,
  quotedMessage,
  onCancelQuote,
  onTyping,
  onStopTyping,
  chatId,
}) {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const [formattingMode, setFormattingMode] = useState(null); // 'bold', 'italic', 'underline'
  const [errorMessage, setErrorMessage] = useState(null);
  const [chatSettings, setChatSettings] = useState({
    enterToSend: true,
    spellCheck: true,
    typingIndicators: true,
    allowEmojis: true,
    allowStickers: true,
    allowGifs: true,
  });
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  // File size limits (in bytes) - matching backend limits
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB for videos
  const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB for images
  const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB for audio

  useEffect(() => {
    // Fetch chat settings
    const fetchChatSettings = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user?.chatSettings) {
            setChatSettings({
              enterToSend: data.user.chatSettings.enterToSend ?? true,
              spellCheck: data.user.chatSettings.spellCheck ?? true,
              typingIndicators: data.user.chatSettings.typingIndicators ?? true,
              allowEmojis: data.user.chatSettings.allowEmojis ?? true,
              allowStickers: data.user.chatSettings.allowStickers ?? true,
              allowGifs: data.user.chatSettings.allowGifs ?? true,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching chat settings:", error);
      }
    };
    fetchChatSettings();

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
    // Auto-dismiss after 5 seconds
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => {
      setErrorMessage(null);
    }, 5000);
  };

  const handleInputChange = (e) => {
    setContent(e.target.value);

    // Only emit typing indicators if enabled
    if (chatSettings.typingIndicators) {
      if (!isTyping) {
        setIsTyping(true);
        onTyping?.();
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onStopTyping?.();
      }, 1000);
    }
  };

  const handleSend = async (messageType = "text", additionalData = {}) => {
    console.log("Message type", messageType);
    const messageContent =
      additionalData?.content?.trim() || content.trim() || "";
    console.log(messageContent);
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

    // Send emoji message
    if (messageType === "emoji" && additionalData.content) {
      await onSend(additionalData.content, replyTo, "emoji", {
        ...additionalData,
        quotedMessage,
      });
      setContent("");
      setIsCodeMode(false);
      setIsMarkdownMode(false);
    }
    // Send sticker message
    else if (messageType === "sticker" && additionalData.content) {
      await onSend(additionalData.content, replyTo, "sticker", {
        ...additionalData,
        quotedMessage,
      });
      setContent("");
      setIsCodeMode(false);
      setIsMarkdownMode(false);
    }
    // Send GIF message
    else if (messageType === "gif" && additionalData.content) {
      await onSend(additionalData.content, replyTo, "gif", {
        ...additionalData,
        quotedMessage,
      });
      setContent("");
      setIsCodeMode(false);
      setIsMarkdownMode(false);
    }
    // Send contact message
    else if (messageType === "contact") {
      await onSend(additionalData.content || "", replyTo, "contact", {
        ...additionalData,
        quotedMessage,
      });
      setContent("");
      setIsCodeMode(false);
      setIsMarkdownMode(false);
    }
    // Send location message
    else if (messageType === "location") {
      await onSend(additionalData.content || "", replyTo, "location", {
        ...additionalData,
        quotedMessage,
      });
      setContent("");
      setIsCodeMode(false);
      setIsMarkdownMode(false);
    }
    // Send text message
    else if (messageContent && messageType === "text") {
      const finalType = isCodeMode
        ? "code"
        : isMarkdownMode
        ? "markdown"
        : "text";
      // Pass both replyTo and quotedMessage - onSend will handle which one to use
      await onSend(messageContent, replyTo, finalType, {
        ...additionalData,
        quotedMessage,
      });
      setContent("");
      setIsCodeMode(false);
      setIsMarkdownMode(false);
    }

    // Send file messages
    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        await handleFileSend(file);
      }
      setSelectedFiles([]);
    }

    // Send voice/camera files
    if (additionalData.file) {
      await handleFileSend(
        additionalData.file,
        messageType,
        additionalData.metadata
      );
    }

    if (replyTo) {
      onCancelReply?.();
    }
    if (quotedMessage) {
      onCancelQuote?.();
    }
    setIsTyping(false);
    onStopTyping?.();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleFileSend = async (file, type = null, metadata = {}) => {
    if (!chatId) {
      console.error("Chat ID is required for file upload");
      showError("Chat ID is required for file upload");
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
    formData.append("chatId", chatId);
    if (type) formData.append("type", type);
    if (replyTo?._id) formData.append("replyTo", replyTo._id);
    if (quotedMessage?._id) formData.append("quotedMessage", quotedMessage._id);
    if (metadata && Object.keys(metadata).length > 0) {
      formData.append("metadata", JSON.stringify(metadata));
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/messages/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // File upload API will handle sending the message
        return data;
      } else {
        // Handle error response from API
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

  const handleStickerSelect = (sticker) => {
    handleSend("sticker", { content: sticker });
    setShowStickerPicker(false);
  };

  const handleGifSelect = (gifUrl) => {
    handleSend("gif", { content: gifUrl });
    setShowGifPicker(false);
  };

  const handleKeyPress = (e) => {
    // If enterToSend is enabled, Enter sends message, Shift+Enter creates new line
    // If enterToSend is disabled, Enter creates new line, no send on Enter
    if (chatSettings.enterToSend) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    }
    // If enterToSend is false, Enter creates new line (default behavior)
  };

  const applyFormatting = (format) => {
    console.log(inputRef.current);
    const textarea = inputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    console.log(start, end);
    const selectedText = content.substring(start, end);
    console.log(selectedText);
    let formattedText = "";
    let cursorOffset = 0;

    switch (format) {
      case "bold":
        if (selectedText) {
          formattedText = `**${selectedText}**`;
          cursorOffset = formattedText.length; // Place cursor after closing **
        } else {
          formattedText = `****`;
          cursorOffset = 2; // Place cursor between the ** markers
        }
        break;
      case "italic":
        if (selectedText) {
          formattedText = `*${selectedText}*`;
          cursorOffset = formattedText.length; // Place cursor after closing *
        } else {
          formattedText = `**`;
          cursorOffset = 1; // Place cursor between the * markers
        }
        break;
      case "underline":
        if (selectedText) {
          formattedText = `__${selectedText}__`;
          cursorOffset = formattedText.length; // Place cursor after closing __
        } else {
          formattedText = `____`;
          cursorOffset = 2; // Place cursor between the __ markers
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

  return (
    <div className={styles.container}>
      {replyTo && <ReplyPreview message={replyTo} onClose={onCancelReply} />}
      {quotedMessage && (
        <QuotePreview quotedMessage={quotedMessage} onClose={onCancelQuote} />
      )}

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

        {chatSettings.allowEmojis && (
          <button
            className={styles.emojiButton}
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowStickerPicker(false);
              setShowGifPicker(false);
            }}
            title="Emoji"
          >
            😊
          </button>
        )}
        {chatSettings.allowStickers && (
          <button
            className={styles.emojiButton}
            onClick={() => {
              setShowStickerPicker(!showStickerPicker);
              setShowEmojiPicker(false);
              setShowGifPicker(false);
            }}
            title="Stickers"
          >
            🎨
          </button>
        )}
        {chatSettings.allowGifs && (
          <button
            className={styles.emojiButton}
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              setShowEmojiPicker(false);
              setShowStickerPicker(false);
            }}
            title="GIFs"
          >
            GIF
          </button>
        )}

        <textarea
          ref={inputRef}
          className={styles.input}
          value={content}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          spellCheck={chatSettings.spellCheck}
          placeholder={
            isCodeMode
              ? "Enter code..."
              : isMarkdownMode
              ? "Type markdown..."
              : "Type a message..."
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
      {showStickerPicker && (
        <StickerPicker
          onSelect={handleStickerSelect}
          isOpen={showStickerPicker}
          onClose={() => setShowStickerPicker(false)}
        />
      )}
      {showGifPicker && (
        <GifPicker
          onSelect={handleGifSelect}
          isOpen={showGifPicker}
          onClose={() => setShowGifPicker(false)}
        />
      )}
    </div>
  );
}
