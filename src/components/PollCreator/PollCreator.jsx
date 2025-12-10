"use client";

import { useState } from "react";
import Modal from "../Modal/Modal.jsx";
import InputBox from "../InputBox/InputBox.jsx";
import Button from "../Button/Button.jsx";
import styles from "./PollCreator.module.css";

export default function PollCreator({ isOpen, onClose, groupId, onCreatePoll }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!question.trim()) {
      setError("Question is required");
      return;
    }

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      setError("At least 2 options are required");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/groups/polls/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId,
          question: question.trim(),
          options: validOptions,
          allowMultipleChoices,
          isAnonymous,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create poll");
      }

      onCreatePoll(data.poll);
      setQuestion("");
      setOptions(["", ""]);
      setAllowMultipleChoices(false);
      setIsAnonymous(false);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Poll">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="question">Poll Question *</label>
          <InputBox
            id="question"
            type="textarea"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question"
            required
            disabled={loading}
            rows={3}
          />
        </div>

        <div className={styles.field}>
          <label>Options *</label>
          {options.map((option, index) => (
            <div key={index} className={styles.optionRow}>
              <InputBox
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                disabled={loading}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleRemoveOption(index)}
                  disabled={loading}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={handleAddOption}
            disabled={loading}
          >
            + Add Option
          </Button>
        </div>

        <div className={styles.checkboxes}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={allowMultipleChoices}
              onChange={(e) => setAllowMultipleChoices(e.target.checked)}
              disabled={loading}
            />
            Allow multiple choices
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              disabled={loading}
            />
            Anonymous poll
          </label>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Poll"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

