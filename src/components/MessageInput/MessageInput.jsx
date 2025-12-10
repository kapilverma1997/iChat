"use client";

import { useState, useRef, useEffect } from "react";
import ReplyPreview from "../ReplyPreview/ReplyPreview.jsx";
import EmojiPicker from "../EmojiPicker/EmojiPicker.jsx";
import VoiceRecorder from "../VoiceRecorder/VoiceRecorder.jsx";
import CameraCapture from "../CameraCapture/CameraCapture.jsx";
import FilePreview from "../FilePreview/FilePreview.jsx";
import styles from "./MessageInput.module.css";

export default function MessageInput({
  onSend,
  replyTo,
  onCancelReply,
  onTyping,
  onStopTyping,
}) {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const [formattingMode, setFormattingMode] = useState(null); // 'bold', 'italic', 'underline'
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    setContent(e.target.value);

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
  };

  const handleSend = async (messageType = "text", additionalData = {}) => {
    const messageContent = content.trim();

    // Don't send if no content and no files
    if (!messageContent && selectedFiles.length === 0 && !additionalData.file) {
      return;
    }

    // Send text message
    if (messageContent && messageType === "text") {
      const finalType = isCodeMode
        ? "code"
        : isMarkdownMode
        ? "markdown"
        : "text";
      await onSend(messageContent, replyTo, finalType, additionalData);
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
    setIsTyping(false);
    onStopTyping?.();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleFileSend = async (file, type = null, metadata = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    if (type) formData.append("type", type);
    if (replyTo?._id) formData.append("replyTo", replyTo._id);

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
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
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
          alert("Could not access location. Please check permissions.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleContactShare = () => {
    // In a real app, you'd use the Contacts API or a contact picker
    // For now, we'll use a prompt
    const name = prompt("Enter contact name:");
    if (!name) return;

    const phone = prompt("Enter phone number (optional):");
    const email = prompt("Enter email (optional):");

    handleSend("contact", {
      metadata: { name, phone: phone || null, email: email || null },
      content: name,
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

    switch (format) {
      case "bold":
        formattedText = `**${selectedText || "text"}**`;
        break;
      case "italic":
        formattedText = `*${selectedText || "text"}*`;
        break;
      case "underline":
        formattedText = `__${selectedText || "text"}__`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent =
      content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);

    // Set cursor position after formatted text
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + formattedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  return (
    <div className={styles.container}>
      {replyTo && <ReplyPreview message={replyTo} onClose={onCancelReply} />}

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

      <div className={styles.inputContainer}>
        <div className={styles.toolbar}>
          <button
            className={styles.toolbarButton}
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
          >
            📎
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
    </div>
  );
}
