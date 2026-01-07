import React from "react";
import styles from "./InputBox.module.css";

export default function InputBox({
  type = "text",
  placeholder,
  value,
  onChange,
  onKeyPress,
  name,
  id,
  required = false,
  multiline = false,
  disabled = false,
  readOnly = false,
  rows = 4,
  className = "",
}) {
  if (multiline || type === "textarea") {
    return (
      <textarea
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        className={`${styles.input} ${styles.textarea} ${className}`}
      />
    );
  }

  return (
    <input
      type={type}
      id={id}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyPress={onKeyPress}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      className={`${styles.input} ${className}`}
    />
  );
}
