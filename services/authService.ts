import apiClient from './apiClient';
import { User, LoginCredentials, AuthResponse } from '../types';

export const authService = {
  // Đăng nhập
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Gọi API thực tế
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Đăng ký
  register: async (userData: any): Promise<AuthResponse> => {
    // Gọi API thực tế
    // const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    // return response.data;
    
    // Mock Register
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                user: {
                    id: `u${Date.now()}`,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random&color=fff`
                },
                accessToken: 'mock-jwt-token-register',
                refreshToken: 'mock-refresh-token'
            });
        }, 1500);
    });
  },

  // Lấy thông tin user hiện tại (thường dùng token để lấy)
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  // Mock login function (Dùng để test khi chưa có Backend thực)
  mockLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Giả lập check password đơn giản
            if (credentials.password === 'error') {
                reject(new Error('Sai mật khẩu'));
                return;
            }

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
  },

  // Mock Google Login
  mockGoogleLogin: async (): Promise<AuthResponse> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                user: {
                    id: 'g1',
                    name: 'Nguyễn Google',
                    email: 'nguyen.google@gmail.com',
                    role: 'STUDENT', // Mặc định là học sinh
                    avatar: 'https://lh3.googleusercontent.com/a/default-user' // Mock avatar
                },
                accessToken: 'mock-google-token-xyz',
                refreshToken: 'mock-refresh-token'
            });
        }, 1200);
    });
  },

  // --- Password Recovery Mock ---
  
  // 1. Gửi mã OTP về email
  sendVerificationCode: async (email: string): Promise<boolean> => {
      return new Promise((resolve) => {
          setTimeout(() => {
              console.log(`[Mock Email] Mã OTP gửi tới ${email} là: 123456`);
              resolve(true);
          }, 1000);
      });
  },

  // 2. Kiểm tra mã OTP
  verifyCode: async (email: string, code: string): Promise<boolean> => {
      return new Promise((resolve, reject) => {
          setTimeout(() => {
              if (code === '123456') {
                  resolve(true);
              } else {
                  reject(new Error("Mã xác thực không chính xác"));
              }
          }, 1000);
      });
  },

  // 3. Đặt lại mật khẩu mới
  resetPassword: async (email: string, newPassword: string): Promise<boolean> => {
      return new Promise((resolve) => {
          setTimeout(() => {
              console.log(`[Mock DB] Đổi mật khẩu cho ${email} thành công.`);
              resolve(true);
          }, 1000);
      });
  }
};