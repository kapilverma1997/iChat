'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = toast.id || Date.now() + Math.random();
    
    setToasts((prev) => {
      // Check if a toast with this ID already exists
      if (prev.some((t) => t.id === id)) {
        console.warn(`Toast with id ${id} already exists, skipping duplicate`);
        return prev;
      }
      
      const newToast = {
        id,
        type: 'default',
        title: '',
        body: '',
        duration: 5000,
        playSound: true,
        onClick: null,
        ...toast,
      };

      return [...prev, newToast];
    });

    // Return toast ID for potential removal
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

