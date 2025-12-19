
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Notification, NotificationType, ThemeMode, EventTheme } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { authService } from '../services/authService';
import { settingEventService } from '../services/settingEventService';

interface AppContextType {
  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  // Event Theme
  eventTheme: EventTheme;
  setEventTheme: (theme: EventTheme) => void;
  toggleGlobalEvent: () => Promise<void>;
  // Animation Toggle
  isAnimationEnabled: boolean;
  setIsAnimationEnabled: (enabled: boolean) => void;
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

  // --- Animation Toggle Logic ---
  const [isAnimationEnabled, setIsAnimationEnabledState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('isAnimationEnabled');
        return saved === null ? true : saved === 'true';
    }
    return true;
  });

  const setIsAnimationEnabled = useCallback((enabled: boolean) => {
    setIsAnimationEnabledState(enabled);
    localStorage.setItem('isAnimationEnabled', String(enabled));
  }, []);

  const setEventTheme = useCallback((newTheme: EventTheme) => {
    setEventThemeState(newTheme);
    localStorage.setItem('eventTheme', newTheme);
  }, []);

  // Hàm bật/tắt sự kiện toàn hệ thống (Global) thông qua API
  const toggleGlobalEvent = useCallback(async () => {
    const isCurrentlyOn = eventTheme !== 'DEFAULT';
    const nextState = !isCurrentlyOn;
    
    try {
      await settingEventService.updateGlobalEventStatus(nextState);
      
      if (nextState) {
        // Nếu bật: Lấy theme từ server hoặc mặc định chọn TET/CHRISTMAS tùy mùa (giả định)
        // Ở đây ta gọi lại API lấy theme để đồng bộ chính xác nhất
        const themeFromApi = await settingEventService.getGlobalEventTheme();
        setEventTheme(themeFromApi !== 'DEFAULT' ? themeFromApi : 'TET'); // Fallback về TET nếu bật mà chưa có theme cụ thể
      } else {
        // Nếu tắt: Chuyển về DEFAULT
        setEventTheme('DEFAULT');
      }
    } catch (error) {
      console.error("Failed to toggle global event:", error);
      throw error;
    }
  }, [eventTheme, setEventTheme]);

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
    toggleGlobalEvent,
    isAnimationEnabled,
    setIsAnimationEnabled,
    notifications, 
    addNotification, 
    removeNotification
  }), [theme, toggleTheme, setThemeMode, eventTheme, setEventTheme, toggleGlobalEvent, isAnimationEnabled, setIsAnimationEnabled, notifications, addNotification, removeNotification]);

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
