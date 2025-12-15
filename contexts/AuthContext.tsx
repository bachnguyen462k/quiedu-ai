import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials } from '../types';
import { authService } from '../services/authService';
import apiClient from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
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
        // Cách 1: Tin tưởng localStorage (nhanh nhưng kém bảo mật nếu token hết hạn mà client không biết)
        setUser(JSON.parse(savedUser));
        
        // Cách 2: Gọi API /me để verify token (an toàn hơn)
        try {
           // Uncomment dòng dưới khi có API thực tế
           // const userData = await authService.getCurrentUser();
           // setUser(userData);
        } catch (error) {
           console.error("Token invalid", error);
           logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      // 1. Gọi API login (Sử dụng mockLogin nếu chưa có BE, đổi thành login để gọi thật)
      // const data = await authService.login(credentials); 
      const data = await authService.mockLogin(credentials); // Tạm thời dùng Mock để UI hoạt động

      // 2. Lưu token & user info
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // 3. Cập nhật state
      setUser(data.user);
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, updateUser }}>
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