import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials } from '../types';
import { authService } from '../services/authService';
import apiClient from '../services/apiClient';

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

  // Khôi phục session khi reload trang
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      // Sử dụng hàm login thực tế thay vì mock
      const data = await authService.login(credentials); 

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
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
            // Gọi API logout để hủy token trên server
            await authService.logout(token);
        }
    } catch (error) {
        console.error("Logout server error", error);
    } finally {
        // Luôn luôn xóa dữ liệu local dù API có lỗi hay không
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
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