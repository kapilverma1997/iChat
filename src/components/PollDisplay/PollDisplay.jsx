"use client";

import { useState, useEffect } from "react";
import styles from "./PollDisplay.module.css";

export default function PollDisplay({ poll, currentUserId, onVoteUpdate }) {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState("");

  // Initialize selected options based on user's existing votes
  useEffect(() => {
    if (poll && poll.options) {
      const userVotedOptions = poll.options
        .map((option, index) => {
          const hasVoted = option.votes?.some(
            (vote) =>
              vote.userId?._id?.toString() === currentUserId?.toString() ||
              vote.userId?.toString() === currentUserId?.toString()
          );
          return hasVoted ? index : null;
        })
        .filter((index) => index !== null);
      setSelectedOptions(userVotedOptions);
    }
  }, [poll, currentUserId]);

  if (!poll) {
    return <div className={styles.poll}>Loading poll...</div>;
  }

  const isClosed =
    poll.isClosed || (poll.expiresAt && new Date() > new Date(poll.expiresAt));
  
  // Calculate totalVotes - ensure it's accurate
  let totalVotes = poll.totalVotes;
  if (poll.allowMultipleChoices) {
    // For multiple choice, count all votes across all options
    const calculatedTotal = poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
    totalVotes = totalVotes || calculatedTotal;
  } else {
    // For single choice, count unique voters
    const uniqueVoters = new Set();
    poll.options.forEach(opt => {
      if (opt.votes) {
        opt.votes.forEach(vote => {
          const voteUserId = vote.userId?._id?.toString() || vote.userId?.toString();
          if (voteUserId) {
            uniqueVoters.add(voteUserId);
          }
        });
      }
    });
    totalVotes = totalVotes || uniqueVoters.size;
  }
  
  // Check if user has voted by checking poll data
  const hasUserVoted = poll.options.some(opt => 
    opt.votes?.some(vote => 
      vote.userId?._id?.toString() === currentUserId?.toString() ||
      vote.userId?.toString() === currentUserId?.toString()
    )
  );

  const handleOptionClick = async (optionIndex) => {
    if (isClosed || isVoting) return;

    let newSelectedOptions;
    if (poll.allowMultipleChoices) {
      // Toggle selection for multiple choice
      newSelectedOptions = selectedOptions.includes(optionIndex)
        ? selectedOptions.filter((idx) => idx !== optionIndex)
        : [...selectedOptions, optionIndex];
    } else {
      // Single choice - replace selection
      newSelectedOptions = [optionIndex];
    }

    // Store previous state for error recovery
    const previousSelectedOptions = selectedOptions;

    // Update local state immediately for instant feedback
    setSelectedOptions(newSelectedOptions);

    // Save vote immediately to persist selection
    setIsVoting(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/groups/polls/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pollId: poll._id,
          optionIndexes: newSelectedOptions,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        // Revert selection on error
        setSelectedOptions(previousSelectedOptions);
        throw new Error(data.error || "Failed to vote");
      }

      // Update poll data immediately
      if (data.poll) {
        // Update local state to reflect the vote immediately
        if (onVoteUpdate) {
          onVoteUpdate(data.poll);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsVoting(false);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0 || isVoting) return;

    setIsVoting(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/groups/polls/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pollId: poll._id,
          optionIndexes: selectedOptions,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to vote");
      }

      // Update poll data immediately
      if (data.poll) {
        // Update local state to reflect the vote immediately
        if (onVoteUpdate) {
          onVoteUpdate(data.poll);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsVoting(false);
    }
  };

  const getOptionPercentage = (option) => {
    if (totalVotes === 0) return 0;
    const voteCount = option.votes?.length || 0;
    return Math.round((voteCount / totalVotes) * 100);
  };

  const isOptionSelected = (optionIndex) => {
    return selectedOptions.includes(optionIndex);
  };

  const hasUserVotedForOption = (option) => {
    return option.votes?.some(
      (vote) =>
        vote.userId?._id?.toString() === currentUserId?.toString() ||
        vote.userId?.toString() === currentUserId?.toString()
    );
  };

  return (
    <div className={styles.pollContainer}>
      <div className={styles.pollHeader}>
        <h3 className={styles.question}>{poll.question}</h3>
        {poll.allowMultipleChoices && (
          <span className={styles.badge}>Multiple choice</span>
        )}
        {poll.isAnonymous && <span className={styles.badge}>Anonymous</span>}
        {isClosed && <span className={styles.badgeClosed}>Closed</span>}
      </div>

      <div className={styles.options}>
        {poll.options.map((option, index) => {
          const percentage = getOptionPercentage(option);
          const isSelected = isOptionSelected(index);
          const userVoted = hasUserVotedForOption(option);
          const voteCount = option.votes?.length || 0;

          return (
            <div
              key={index}
              className={`${styles.option} ${
                isSelected ? styles.selected : ""
              } ${userVoted ? styles.userVoted : ""}`}
              onClick={() => !isClosed && handleOptionClick(index)}
            >
              <div className={styles.optionContent}>
                {!isClosed && (
                  <div className={styles.optionInput}>
                    {poll.allowMultipleChoices ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleOptionClick(index)}
                        disabled={isVoting}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => handleOptionClick(index)}
                        disabled={isVoting}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                )}
                <div className={styles.optionText}>
                  <span className={styles.optionLabel}>{option.text}</span>
                  {!poll.isAnonymous && voteCount > 0 && (
                    <span className={styles.voteCount}>
                      {voteCount} vote{voteCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              {(hasUserVoted || isClosed) && (
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${percentage}%` }}
                  />
                  <span className={styles.percentage}>{percentage}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isClosed && (
        <div className={styles.actions}>
          {selectedOptions.length > 0 && !hasUserVoted && (
            <button
              className={styles.voteButton}
              onClick={handleVote}
              disabled={isVoting || selectedOptions.length === 0}
            >
              {isVoting ? "Voting..." : "Vote"}
            </button>
          )}
          {hasUserVoted && <span className={styles.votedText}>You voted</span>}
        </div>
      )}

      <div className={styles.pollFooter}>
        <span className={styles.totalVotes}>
          {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
        </span>
        {poll.expiresAt && (
          <span className={styles.expiresAt}>
            {isClosed
              ? "Expired"
              : `Expires ${new Date(poll.expiresAt).toLocaleDateString()}`}
          </span>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
