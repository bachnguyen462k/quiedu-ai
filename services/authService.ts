import apiClient from './apiClient';
import { User, LoginCredentials, AuthResponse } from '../types';

export const authService = {
  // Đăng nhập thực tế với API
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
        // Gọi API login: POST /identity/auth/token
        const response = await apiClient.post('/identity/auth/token', {
            username: credentials.email, // Form dùng biến 'email' nhưng gửi lên là 'username'
            password: credentials.password
        });

        const responseData = response.data;

        // Kiểm tra logic code thành công (1000)
        if (responseData.code !== 1000) {
            // Xử lý các mã lỗi cụ thể nếu server trả về HTTP 200 OK
            if (responseData.code === 1005) {
                throw new Error("Tài khoản không tồn tại");
            }
            throw new Error(responseData.message || "Đăng nhập thất bại");
        }

        const token = responseData.result?.token;
        const isAuthenticated = responseData.result?.authenticated;

        if (!token || !isAuthenticated) {
            throw new Error("Xác thực thất bại hoặc không có token");
        }

        // Vì API login hiện tại chỉ trả về token, ta tạo thông tin user giả định từ username
        // Trong thực tế, bạn sẽ dùng token này để gọi API /users/myInfo lấy thông tin chi tiết
        const mockUserFromLogin: User = {
            id: 'user-' + credentials.email,
            name: credentials.email, // Dùng username làm tên
            email: credentials.email.includes('@') ? credentials.email : `${credentials.email}@local.dev`,
            role: 'TEACHER', // Mặc định quyền TEACHER để demo full tính năng
            avatar: `https://ui-avatars.com/api/?name=${credentials.email}&background=random&color=fff`
        };

        return {
            user: mockUserFromLogin,
            accessToken: token,
            refreshToken: '' // API này chưa trả về refresh token
        };
    } catch (error: any) {
        console.error("Login API Error:", error);
        
        // Xử lý lỗi trả về từ server (HTTP 4xx, 5xx)
        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.code === 1005) {
                throw "Tài khoản không tồn tại";
            }
            throw errorData.message || "Lỗi hệ thống";
        }

        // Xử lý lỗi ném ra thủ công trong khối try
        throw error.message || "Lỗi kết nối máy chủ";
    }
  },

  // Đăng xuất
  logout: async (token: string): Promise<void> => {
      try {
          await apiClient.post('/identity/auth/logout', { token });
      } catch (error) {
          console.error("Logout API Error:", error);
          // Không throw lỗi ở đây để luồng logout ở client vẫn tiếp tục (xóa token ở localStorage)
      }
  },

  // Đăng ký (Mock)
  register: async (userData: any): Promise<AuthResponse> => {
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

  // Lấy thông tin user hiện tại (Sử dụng token đã lưu)
  getCurrentUser: async (): Promise<User> => {
    // API lấy thông tin user của bạn, ví dụ: /identity/users/myInfo
    const response = await apiClient.get<User>('/identity/users/myInfo');
    return response.data;
  },

  // Các hàm Mock khác giữ nguyên để app không bị lỗi
  mockGoogleLogin: async (): Promise<AuthResponse> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                user: {
                    id: 'g1',
                    name: 'Nguyễn Google',
                    email: 'nguyen.google@gmail.com',
                    role: 'STUDENT',
                    avatar: 'https://lh3.googleusercontent.com/a/default-user'
                },
                accessToken: 'mock-google-token-xyz',
                refreshToken: 'mock-refresh-token'
            });
        }, 1200);
    });
  },

  sendVerificationCode: async (email: string): Promise<boolean> => {
      return new Promise((resolve) => { setTimeout(() => resolve(true), 1000); });
  },
  verifyCode: async (email: string, code: string): Promise<boolean> => {
      return new Promise((resolve, reject) => { 
          code === '123456' ? resolve(true) : reject(new Error("Sai mã")); 
      });
  },
  resetPassword: async (email: string, newPassword: string): Promise<boolean> => {
      return new Promise((resolve) => { setTimeout(() => resolve(true), 1000); });
  }
};