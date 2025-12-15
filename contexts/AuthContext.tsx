import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials } from '../types';
import { authService } from '../services/authService';
import apiClient from '../services/apiClient';
import { useApp } from './AppContext';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: any) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  // Recovery methods
  requestPasswordReset: (email: string) => Promise<boolean>;
  verifyResetCode: (email: string, code: string) => Promise<boolean>;
  confirmPasswordReset: (email: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Use setThemeMode from AppContext to sync theme without triggering API update loop
  const { setThemeMode } = useApp();

  // Khôi phục session khi reload trang
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        try {
            // Gọi API để lấy thông tin user mới nhất thay vì dùng localStorage cũ
            const userData = await authService.getCurrentUser();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData)); // Cập nhật cache local
            
            // Sync theme from API
            // Check for value existence instead of strict boolean type to be safer
            if (userData.darkMode !== undefined && userData.darkMode !== null) {
                setThemeMode(userData.darkMode ? 'dark' : 'light');
            }
        } catch (error) {
            console.error("Session expired or invalid", error);
            // Nếu token hết hạn hoặc lỗi, xóa session
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [setThemeMode]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const data = await authService.login(credentials); 

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

      // Sync theme from API
      // Check for value existence instead of strict boolean type to be safer
      if (data.user.darkMode !== undefined && data.user.darkMode !== null) {
          const targetTheme = data.user.darkMode ? 'dark' : 'light';
          setThemeMode(targetTheme);
          // Force local storage update immediately to prevent race conditions
          localStorage.setItem('theme', targetTheme);
      }
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
      setIsLoading(true);
      try {
          const data = await authService.register(userData);
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
          // Register mock usually returns default theme, but sync anyway
          if (data.user.darkMode !== undefined && data.user.darkMode !== null) {
              setThemeMode(data.user.darkMode ? 'dark' : 'light');
          }
      } catch (error) {
          console.error("Register failed", error);
          throw error;
      } finally {
          setIsLoading(false);
      }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
        const data = await authService.mockGoogleLogin();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        
        if (data.user.darkMode !== undefined && data.user.darkMode !== null) {
            setThemeMode(data.user.darkMode ? 'dark' : 'light');
        }
    } catch (error) {
        console.error("Google Login failed", error);
        throw error;
    } finally {
        setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
        const token = localStorage.getItem('accessToken');
        if (token) {
            await authService.logout(token);
        }
    } catch (error) {
        console.error("Logout server error", error);
    } finally {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
        // Optional: Reset to light mode or keep current preference on logout
    }
  };

  const updateUser = (updatedUser: User) => {
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // --- Password Recovery Wrappers ---
  const requestPasswordReset = async (email: string) => {
      return await authService.sendVerificationCode(email);
  };

  const verifyResetCode = async (email: string, code: string) => {
      return await authService.verifyCode(email, code);
  };

  const confirmPasswordReset = async (email: string, newPassword: string) => {
      return await authService.resetPassword(email, newPassword);
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        login, 
        register, 
        loginWithGoogle, 
        logout, 
        updateUser,
        requestPasswordReset,
        verifyResetCode,
        confirmPasswordReset
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};