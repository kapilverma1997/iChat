"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    const exchangeSessionForTokens = async () => {
      if (status === "loading") return;
      alert("exchangeSessionForTokens");
      if (status === "authenticated" && session?.user?.email) {
        try {
          // Call our API to exchange NextAuth session for JWT tokens
          const response = await fetch("/api/auth/oauth/exchange", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();

            // Store tokens
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);

            if (data.user) {
              localStorage.setItem("user", JSON.stringify(data.user));
            }

            // Redirect to chats
            router.push("/chats");
          } else {
            const error = await response.json();
            router.push(`/auth/login?error=${error.error || "oauth_failed"}`);
          }
        } catch (error) {
          console.error("Error exchanging session:", error);
          router.push("/auth/login?error=oauth_error");
        }
      } else if (status === "unauthenticated") {
        // Not authenticated, redirect to login
        router.push("/auth/login?error=oauth_failed");
      }
    };

    exchangeSessionForTokens();
  }, [session, status, router]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div style={{ fontSize: "24px" }}>🔄</div>
      <p>Completing sign in...</p>
    </div>
  );
}
