"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function JoinGroupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const [group, setGroup] = useState(null);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid invite link. Token is missing.");
      return;
    }

    const joinGroup = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        
        if (!accessToken) {
          setStatus("error");
          setMessage("Please log in to join this group.");
          // Redirect to login after a delay
          setTimeout(() => {
            router.push(`/auth/login?redirect=/groups/join?token=${token}`);
          }, 2000);
          return;
        }

        const response = await fetch("/api/groups/join-by-link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Successfully joined the group!");
          setGroup(data.group);
          
          // Redirect to groups page after 2 seconds
          setTimeout(() => {
            router.push("/groups");
          }, 2000);
        } else {
          // Handle specific error cases
          if (response.status === 400 && data.error?.includes("already a member")) {
            // User is already a member - treat as success
            setStatus("success");
            setMessage("You are already a member of this group.");
            // Redirect immediately
            setTimeout(() => {
              router.push("/groups");
            }, 1500);
          } else {
            setStatus("error");
            setMessage(data.error || "Failed to join the group.");
          }
        }
      } catch (error) {
        console.error("Error joining group:", error);
        setStatus("error");
        setMessage("An error occurred while joining the group. Please try again.");
      }
    };

    joinGroup();
  }, [searchParams, router]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === "loading" && (
          <>
            <div className={styles.spinner}></div>
            <h2>Joining group...</h2>
            <p>Please wait while we process your request.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className={styles.successIcon}>✓</div>
            <h2>Success!</h2>
            <p>{message}</p>
            {group && (
              <div className={styles.groupInfo}>
                <p className={styles.groupName}>{group.name}</p>
                {group.description && (
                  <p className={styles.groupDescription}>{group.description}</p>
                )}
              </div>
            )}
            <p className={styles.redirectMessage}>
              Redirecting to groups page...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className={styles.errorIcon}>✗</div>
            <h2>Unable to Join</h2>
            <p>{message}</p>
            <div className={styles.actions}>
              <button
                onClick={() => router.push("/groups")}
                className={styles.button}
              >
                Go to Groups
              </button>
              <button
                onClick={() => window.location.reload()}
                className={styles.buttonSecondary}
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

