import apiClient from './apiClient';
import { User, LoginCredentials, AuthResponse, UserRole } from '../types';

export const authService = {
  // Đăng nhập thực tế với API
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
        // 1. Gọi API login để lấy Token
        const response = await apiClient.post('/identity/auth/token', {
            username: credentials.email,
            password: credentials.password
        });

        const responseData = response.data;

        if (responseData.code !== 1000) {
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

        // Lưu tạm token để apiClient có thể dùng nó cho request tiếp theo
        localStorage.setItem('accessToken', token);

        // 2. Gọi API lấy thông tin User chi tiết
        const user = await authService.getCurrentUser();

        return {
            user: user,
            accessToken: token,
            refreshToken: '' 
        };
    } catch (error: any) {
        console.error("Login API Error:", error);
        
        // Xóa token nếu quá trình đăng nhập bị lỗi giữa chừng
        localStorage.removeItem('accessToken');

        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.code === 1005) {
                throw "Tài khoản không tồn tại";
            }
            throw errorData.message || "Lỗi hệ thống";
        }
        throw error.message || "Lỗi kết nối máy chủ";
    }
  },

  // Đăng xuất
  logout: async (token: string): Promise<void> => {
      try {
          await apiClient.post('/identity/auth/logout', { token });
      } catch (error) {
          console.error("Logout API Error:", error);
      }
  },

  // Đăng ký (Mock - giữ nguyên để không ảnh hưởng luồng khác)
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

  // Lấy thông tin user hiện tại từ API /identity/users/my-info
  getCurrentUser: async (): Promise<User> => {
    try {
        const response = await apiClient.get('/identity/users/my-info');
        const result = response.data.result;

        // Ánh xạ Role từ Backend sang Frontend
        // Backend trả về mảng roles: [{name: "ADMIN", ...}]
        // Frontend cần: "TEACHER" hoặc "STUDENT"
        let role: UserRole = 'STUDENT';
        if (result.roles && result.roles.length > 0) {
            const roleName = result.roles[0].name;
            if (roleName === 'ADMIN' || roleName === 'TEACHER') {
                role = 'TEACHER';
            }
        }

        // Tạo tên hiển thị (ưu tiên Full Name, nếu null thì dùng Username)
        const displayName = (result.firstName || result.lastName) 
            ? `${result.lastName || ''} ${result.firstName || ''}`.trim() 
            : result.username;

        return {
            id: result.id,
            name: displayName,
            email: result.username, // Dùng username làm định danh email
            role: role,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`
        };
    } catch (error) {
        console.error("Get User Info Error:", error);
        throw error;
    }
  },

  // Các hàm Mock khác giữ nguyên
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