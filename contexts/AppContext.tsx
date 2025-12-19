
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Notification, NotificationType, ThemeMode, EventTheme } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { authService } from '../services/authService';

interface AppContextType {
  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  // Event Theme
  eventTheme: EventTheme;
  setEventTheme: (theme: EventTheme) => void;
  // Notifications
  notifications: Notification[];
  addNotification: (message: string, type: NotificationType) => void;
  removeNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- UI Theme Logic ---
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme') as ThemeMode;
        if (savedTheme) return savedTheme;
        return 'light';
    }
    return 'light';
  });

  // --- Event Theme Logic ---
  const [eventTheme, setEventThemeState] = useState<EventTheme>(() => {
    if (typeof window !== 'undefined') {
        return (localStorage.getItem('eventTheme') as EventTheme) || 'DEFAULT';
    }
    return 'DEFAULT';
  });

  const setEventTheme = useCallback((newTheme: EventTheme) => {
    setEventThemeState(newTheme);
    localStorage.setItem('eventTheme', newTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
      setTheme(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
        const newTheme = prev === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
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
    setTimeout(() => {
      setNotifications(current => current.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const contextValue = useMemo(() => ({
    theme, 
    toggleTheme, 
    setThemeMode, 
    eventTheme,
    setEventTheme,
    notifications, 
    addNotification, 
    removeNotification
  }), [theme, toggleTheme, setThemeMode, eventTheme, setEventTheme, notifications, addNotification, removeNotification]);

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
