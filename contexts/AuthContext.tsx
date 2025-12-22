
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  loginWithGoogle: (idToken: string, roleId: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  requestPasswordReset: (email: string) => Promise<boolean>;
  verifyResetCode: (email: string, code: string) => Promise<boolean>;
  confirmPasswordReset: (email: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setThemeMode } = useApp();
  
  // Flag khóa khởi tạo
  const isInitializing = useRef(false);

  useEffect(() => {
    // Nếu đã/đang khởi tạo thì thoát ngay
    if (isInitializing.current) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
        setIsLoading(false);
        isInitializing.current = true;
        return;
    }

    const initAuth = async () => {
        isInitializing.current = true; // Khóa ngay lập tức trước khi await
        try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            
            if (userData.darkMode !== undefined && userData.darkMode !== null) {
                setThemeMode(userData.darkMode ? 'dark' : 'light');
            }
        } catch (error) {
            console.error("Session expired or invalid", error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
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

      if (data.user.darkMode !== undefined && data.user.darkMode !== null) {
          const targetTheme = data.user.darkMode ? 'dark' : 'light';
          setThemeMode(targetTheme);
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

  const loginWithGoogle = async (idToken: string, roleId: string) => {
    setIsLoading(true);
    try {
        const data = await authService.loginWithGoogle(idToken, roleId);
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
    }
  };

  const updateUser = (updatedUser: User) => {
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
  };

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
