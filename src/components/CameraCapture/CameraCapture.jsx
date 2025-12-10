"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./CameraCapture.module.css";

export default function CameraCapture({ onCapture, onCancel }) {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [mode, setMode] = useState("photo"); // 'photo' or 'video'
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: mode === "video",
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Could not access camera. Please check permissions.");
      onCancel?.();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      const imageDataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(imageDataUrl);
    }
  };

  const startVideoRecording = () => {
    if (stream && videoRef.current) {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        setCapturedImage(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    if (capturedImage) {
      // Convert data URL to blob if it's a photo
      if (mode === "photo" && capturedImage.startsWith("data:")) {
        fetch(capturedImage)
          .then((res) => res.blob())
          .then((blob) => {
            onCapture(blob, mode);
            handleCancel();
          });
      } else {
        // For video, we need to get the blob from the recorded chunks
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        onCapture(blob, mode);
        handleCancel();
      }
    }
  };

  const handleCancel = () => {
    stopCamera();
    setCapturedImage(null);
    setIsRecording(false);
    onCancel?.();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setIsRecording(false);
    if (!stream) {
      startCamera();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.modeButton} onClick={() => setMode("photo")}>
          📷 Photo
        </button>
        <button className={styles.modeButton} onClick={() => setMode("video")}>
          🎥 Video
        </button>
        <button className={styles.closeButton} onClick={handleCancel}>
          ×
        </button>
      </div>

      {!capturedImage ? (
        <div className={styles.camera}>
          <video ref={videoRef} autoPlay playsInline className={styles.video} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div className={styles.controls}>
            {mode === "photo" ? (
              <button className={styles.captureButton} onClick={capturePhoto}>
                📷
              </button>
            ) : (
              <>
                {!isRecording ? (
                  <button
                    className={styles.recordButton}
                    onClick={startVideoRecording}
                  >
                    🎥 Start Recording
                  </button>
                ) : (
                  <button
                    className={styles.stopButton}
                    onClick={stopVideoRecording}
                  >
                    ⏹ Stop
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.preview}>
          {mode === "photo" ? (
            <img
              src={capturedImage}
              alt="Captured"
              className={styles.previewImage}
            />
          ) : (
            <video
              src={capturedImage}
              controls
              className={styles.previewVideo}
            />
          )}
          <div className={styles.actions}>
            <button className={styles.sendButton} onClick={handleSend}>
              Send
            </button>
            <button className={styles.retakeButton} onClick={handleRetake}>
              Retake
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
