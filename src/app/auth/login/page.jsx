"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import InputBox from "../../../components/InputBox/InputBox.jsx";
import Button from "../../../components/Button/Button.jsx";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [oauthLoading, setOauthLoading] = useState(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorType, setTwoFactorType] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);

  // Generate or retrieve device ID
  const getDeviceId = () => {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Check if 2FA is required
      if (data.requires2FA) {
        setRequires2FA(true);
        setTwoFactorType(data.twoFactorType);
        setLoading(false);
        return;
      }

      // Store tokens
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to dashboard
      router.push("/chats");
    } catch (err) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e) => {
    e.preventDefault();
    setError("");
    setVerifying2FA(true);

    try {
      const deviceId = getDeviceId();
      const deviceName = navigator.userAgent;

      const response = await fetch("/api/auth/verify-login-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          code: twoFactorCode,
          deviceId,
          deviceName,
          trustDevice: formData.rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // Store tokens
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to dashboard
      router.push("/chats");
    } catch (err) {
      setError(err.message || "Verification failed");
      setVerifying2FA(false);
    }
  };

  // Check for OAuth errors in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    if (errorParam) {
      if (errorParam === "oauth_failed") {
        setError("OAuth authentication failed. Please try again.");
      } else if (errorParam === "user_not_found") {
        setError("User not found. Please register first.");
      } else if (errorParam === "oauth_error") {
        setError("An error occurred during OAuth authentication.");
      }
      // Clean up URL
      window.history.replaceState({}, "", "/auth/login");
    }
  }, []);

  const handleOAuthSignIn = async (provider) => {
    setOauthLoading(provider);
    setError("");
    try {
      // Directly navigate to NextAuth OAuth endpoint
      const callbackUrl = encodeURIComponent(
        `${window.location.origin}/auth/oauth/callback`
      );
      window.location.href = `/api/auth/signin/${provider}?callbackUrl=${callbackUrl}`;
    } catch (err) {
      console.error("OAuth sign in error:", err);
      setError(`Failed to sign in with ${provider}. Please try again.`);
      setOauthLoading(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Link href="/" className={styles.homeButton} title="Go to Home">
          🏠
        </Link>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to your iChat account</p>

        {error && <div className={styles.error}>{error}</div>}

        {!requires2FA ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <InputBox
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <InputBox
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.options}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) =>
                    setFormData({ ...formData, rememberMe: e.target.checked })
                  }
                />
                <span>Remember me</span>
              </label>
              <Link href="/auth/reset-password" className={styles.link}>
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handle2FAVerify} className={styles.form}>
            <div className={styles.field}>
              <p className={styles.twoFactorMessage}>
                {twoFactorType === "email"
                  ? "We've sent a verification code to your email address."
                  : twoFactorType === "sms"
                  ? "We've sent a verification code to your phone number."
                  : "Enter the code from your authenticator app."}
              </p>
              <label htmlFor="twoFactorCode">Verification Code</label>
              <InputBox
                type="text"
                id="twoFactorCode"
                name="twoFactorCode"
                placeholder="Enter verification code"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                maxLength={6}
                required
                autoFocus
              />
            </div>

            <div className={styles.options}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) =>
                    setFormData({ ...formData, rememberMe: e.target.checked })
                  }
                />
                <span>Trust this device</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={verifying2FA || !twoFactorCode}
              className={styles.submitButton}
            >
              {verifying2FA ? "Verifying..." : "Verify"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setRequires2FA(false);
                setTwoFactorCode("");
                setError("");
              }}
              className={styles.link}
              style={{ marginTop: "10px", display: "block", textAlign: "center", background: "none", border: "none", cursor: "pointer" }}
            >
              ← Back to Login
            </button>
          </form>
        )}

        {/* <div className={styles.divider}>
          <span>OR</span>
        </div> */}

        {/* <div className={styles.socialButtons}>
          <Button
            variant="outline"
            className={styles.socialButton}
            onClick={() => handleOAuthSignIn("google")}
            disabled={loading || oauthLoading !== null}
          >
            {oauthLoading === "google"
              ? "Connecting..."
              : "Sign in with Google"}
          </Button>
          <Button
            variant="outline"
            className={styles.socialButton}
            onClick={() => handleOAuthSignIn("github")}
            disabled={loading || oauthLoading !== null}
          >
            {oauthLoading === "github"
              ? "Connecting..."
              : "Sign in with GitHub"}
          </Button>
        </div> */}

        <p className={styles.footer}>
          Don&apos;t have an account? <Link href="/auth/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
