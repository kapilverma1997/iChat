"use client";

import { useState } from "react";
import styles from "./TwoFactorModal.module.css";

export default function TwoFactorModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState("select"); // select, verify, backup
  const [type, setType] = useState("email"); // email, sms, authenticator
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backupCodes, setBackupCodes] = useState(null);

  const handleEnable = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/security/verify2FA", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          phone: type === "sms" ? phone : undefined,
        }),
      });

      if (response.ok) {
        setStep("verify");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to enable 2FA");
      }
    } catch (error) {
      setError("Failed to enable 2FA");
      console.error("Error enabling 2FA:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/security/verify2FA", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code,
          trustDevice: true,
        }),
      });

      if (response.ok) {
        // Generate backup codes
        const codesResponse = await fetch("/api/security/verify2FA", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (codesResponse.ok) {
          const codesData = await codesResponse.json();
          setBackupCodes(codesData.backupCodes);
          setStep("backup");
        } else {
          onSuccess?.();
          onClose();
        }
      } else {
        const data = await response.json();
        setError(data.error || "Invalid verification code");
      }
    } catch (error) {
      setError("Failed to verify code");
      console.error("Error verifying 2FA:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("select");
    setCode("");
    setPhone("");
    setError(null);
    setBackupCodes(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={handleClose}>
          ×
        </button>
        <h2 className={styles.title}>Two-Step Verification</h2>

        {error && <div className={styles.error}>{error}</div>}

        {step === "select" && (
          <div className={styles.content}>
            <p className={styles.description}>
              Choose a method to verify your identity:
            </p>

            <div className={styles.options}>
              <label className={styles.option}>
                <input
                  type="radio"
                  name="type"
                  value="email"
                  checked={type === "email"}
                  onChange={(e) => setType(e.target.value)}
                />
                <span>Email</span>
              </label>

              {/* <label className={styles.option}>
                <input
                  type="radio"
                  name="type"
                  value="sms"
                  checked={type === 'sms'}
                  onChange={(e) => setType(e.target.value)}
                />
                <span>SMS</span>
              </label>

              <label className={styles.option}>
                <input
                  type="radio"
                  name="type"
                  value="authenticator"
                  checked={type === 'authenticator'}
                  onChange={(e) => setType(e.target.value)}
                />
                <span>Authenticator App</span>
              </label> */}
            </div>

            {type === "sms" && (
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={styles.input}
              />
            )}

            <button
              className={styles.button}
              onClick={handleEnable}
              disabled={loading || (type === "sms" && !phone)}
            >
              {loading ? "Enabling..." : "Enable 2FA"}
            </button>
          </div>
        )}

        {step === "verify" && (
          <div className={styles.content}>
            <p className={styles.description}>
              Enter the verification code sent to your{" "}
              {type === "email"
                ? "email"
                : type === "sms"
                ? "phone"
                : "authenticator app"}
              :
            </p>

            <input
              type="text"
              placeholder="Verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={styles.input}
              maxLength={6}
            />

            <button
              className={styles.button}
              onClick={handleVerify}
              disabled={loading || !code}
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </div>
        )}

        {step === "backup" && (
          <div className={styles.content}>
            <p className={styles.description}>
              Save these backup codes in a safe place. You can use them if you
              lose access to your 2FA device:
            </p>

            <div className={styles.backupCodes}>
              {backupCodes?.map((code, index) => (
                <div key={index} className={styles.backupCode}>
                  {code}
                </div>
              ))}
            </div>

            <button
              className={styles.button}
              onClick={() => {
                onSuccess?.();
                handleClose();
              }}
            >
              I've Saved These Codes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
