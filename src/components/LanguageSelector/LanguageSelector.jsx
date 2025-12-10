"use client";

import React from "react";
import Dropdown from "../Dropdown/Dropdown.jsx";

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
];

export default function LanguageSelector({
  currentLanguage,
  onLanguageChange,
  className = "",
}) {
  return (
    <div className={className}>
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        Language
      </label>
      <Dropdown
        options={languages}
        value={currentLanguage}
        onChange={onLanguageChange}
        placeholder="Select language"
      />
    </div>
  );
}
