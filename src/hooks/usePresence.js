'use client';

import { useEffect } from 'react';
import { initializePresence, cleanupPresence } from '../lib/presence.js';

export function usePresence() {
  useEffect(() => {
    initializePresence();
    return () => {
      cleanupPresence();
    };
  }, []);
}