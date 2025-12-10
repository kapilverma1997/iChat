"use client";

import styles from "./PriorityLabel.module.css";

export default function PriorityLabel({ priority = "normal" }) {
  const getLabelClass = () => {
    switch (priority) {
      case "urgent":
        return styles.urgent;
      case "important":
        return styles.important;
      default:
        return styles.normal;
    }
  };

  const getLabelText = () => {
    switch (priority) {
      case "urgent":
        return "Urgent";
      case "important":
        return "Important";
      default:
        return null;
    }
  };

  if (priority === "normal") return null;

  return <span className={`${styles.priorityLabel} ${getLabelClass()}`}>{getLabelText()}</span>;
}

