
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Notification, NotificationType, ThemeMode } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { authService } from '../services/authService';

interface AppContextType {
  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void; // Allow setting theme explicitly (e.g. from API data)
  // Notifications
  notifications: Notification[];
  addNotification: (message: string, type: NotificationType) => void;
  removeNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- Theme Logic ---
  const [theme, setTheme] = useState<ThemeMode>(() => {
    // Check local storage or default to light
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme') as ThemeMode;
        if (savedTheme) return savedTheme;
        // Default to 'light' regardless of system preference
        return 'light';
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

  // Set theme without calling API (used for syncing with backend data on load)
  // Wrapped in useCallback to maintain stable reference preventing AuthContext re-runs
  const setThemeMode = useCallback((mode: ThemeMode) => {
      setTheme(mode);
  }, []);

  // Toggle theme and call API (user action)
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
        const newTheme = prev === 'light' ? 'dark' : 'light';
        
        // 1. Save to localStorage IMMEDIATELY to prevent FOUC on reload
        localStorage.setItem('theme', newTheme);

        // 2. Call API to update theme preference if user is logged in
        if (localStorage.getItem('accessToken')) {
            authService.updateTheme(newTheme);
        }
        
        return newTheme;
    });
  }, []);

  // --- Notification Logic ---
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((message: string, type: NotificationType) => {
    const id = uuidv4();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto dismiss
    setTimeout(() => {
      setNotifications(current => current.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const contextValue = useMemo(() => ({
    theme, 
    toggleTheme, 
    setThemeMode, 
    notifications, 
    addNotification, 
    removeNotification
  }), [theme, toggleTheme, setThemeMode, notifications, addNotification, removeNotification]);

  return (
    <AppContext.Provider value={contextValue}>
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
