import apiClient from './apiClient';
import { User, LoginCredentials, AuthResponse } from '../types';

export const authService = {
  // Đăng nhập
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Gọi API thực tế
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Đăng ký (nếu cần)
  register: async (userData: any): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  // Lấy thông tin user hiện tại (thường dùng token để lấy)
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  // Mock login function (Dùng để test khi chưa có Backend thực)
  mockLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const isTeacher = credentials.email.includes('.gv');
            const mockUser: User = isTeacher 
            ? {
                id: 't1',
                name: 'Cô Thu Lan',
                email: credentials.email,
                role: 'TEACHER',
                avatar: 'https://ui-avatars.com/api/?name=Thu+Lan&background=6366f1&color=fff'
              }
            : {
                id: 's1',
                name: 'Nguyễn Văn Nam',
                email: credentials.email,
                role: 'STUDENT',
                avatar: 'https://ui-avatars.com/api/?name=Van+Nam&background=10b981&color=fff'
              };
            
            resolve({
                user: mockUser,
                accessToken: 'mock-jwt-token-xyz-123',
                refreshToken: 'mock-refresh-token'
            });
        }, 800);
    });
  }
};