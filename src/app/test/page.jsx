"use client";
import { useToast } from "../../contexts/ToastContext.jsx";

export default function MyComponent() {
  const { addToast } = useToast();

  const showCustomToast = () => {
    addToast({
      type: "message",
      title: "Custom Notification",
      body: "This is a custom toast notification",
      duration: 5000,
      playSound: true,
      onClick: () => {
        // Navigate or perform action
        router.push("/chats");
      },
    });
  };

  return <button onClick={showCustomToast}>Show Toast</button>;
}
