import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification, NotificationType, ThemeMode } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;
  // Notifications
  notifications: Notification[];
  addNotification: (message: string, type: NotificationType) => void;
  removeNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- Theme Logic ---
  const [theme, setTheme] = useState<ThemeMode>(() => {
    // Check local storage or system preference
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme') as ThemeMode;
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // --- Notification Logic ---
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: NotificationType) => {
    const id = uuidv4();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto dismiss
    setTimeout(() => {
      removeNotification(id);
    }, 4000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, notifications, addNotification, removeNotification }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};