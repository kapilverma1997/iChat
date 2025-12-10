'use client';

// Client-side presence management
// This handles automatic presence updates based on user activity

let presenceInterval = null;
let lastActivityTime = Date.now();
const AWAY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export function initializePresence() {
  // Set user as online when page loads
  updatePresence('online');

  // Track user activity
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach((event) => {
    document.addEventListener(event, markActivity, { passive: true });
  });

  // Check for away status periodically
  presenceInterval = setInterval(() => {
    const timeSinceLastActivity = Date.now() - lastActivityTime;
    if (timeSinceLastActivity > AWAY_THRESHOLD) {
      updatePresence('away');
    }
  }, 60000); // Check every minute

  // Set offline when page unloads
  window.addEventListener('beforeunload', () => {
    updatePresence('offline');
  });
}

export function cleanupPresence() {
  if (presenceInterval) {
    clearInterval(presenceInterval);
    presenceInterval = null;
  }
  updatePresence('offline');
}

function markActivity() {
  lastActivityTime = Date.now();
  updatePresence('online');
}

async function updatePresence(status) {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    await fetch('/api/presence/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ presenceStatus: status }),
    });
  } catch (error) {
    console.error('Failed to update presence:', error);
  }
}
