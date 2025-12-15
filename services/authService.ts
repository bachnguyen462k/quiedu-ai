import apiClient from './apiClient';
import { User, LoginCredentials, AuthResponse, UserRole, ThemeMode } from '../types';

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
                    roles: ['STUDENT'],
                    permissions: [],
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random&color=fff`,
                    darkMode: false
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

        const mappedRoles: UserRole[] = [];
        const permissions: string[] = [];
        
        if (result.roles && Array.isArray(result.roles)) {
            result.roles.forEach((r: any) => {
                // Map Roles
                if (r.name === 'ADMIN' || r.name === 'TEACHER') {
                    if (!mappedRoles.includes('TEACHER')) mappedRoles.push('TEACHER');
                }
                if (r.name === 'USER' || r.name === 'STUDENT') {
                    if (!mappedRoles.includes('STUDENT')) mappedRoles.push('STUDENT');
                }

                // Map Permissions (Flatten nested permissions)
                if (r.permissions && Array.isArray(r.permissions)) {
                    r.permissions.forEach((p: any) => {
                        if (p.name && !permissions.includes(p.name)) {
                            permissions.push(p.name);
                        }
                    });
                }
            });
        }

        // Default role nếu không có
        if (mappedRoles.length === 0) {
            mappedRoles.push('STUDENT');
        }

        // Tạo tên hiển thị (ưu tiên Full Name, nếu null thì dùng Username)
        const displayName = (result.firstName || result.lastName) 
            ? `${result.lastName || ''} ${result.firstName || ''}`.trim() 
            : result.username;

        return {
            id: result.id,
            name: displayName,
            email: result.username, // Dùng username làm định danh email
            roles: mappedRoles,
            permissions: permissions, // Danh sách quyền đã flatten
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`,
            darkMode: result.darkMode // Map field darkMode từ API
        };
    } catch (error) {
        console.error("Get User Info Error:", error);
        throw error;
    }
  },

  // Cập nhật Theme Mode cho user
  updateTheme: async (theme: ThemeMode): Promise<void> => {
      try {
          // PUT /identity/users/theme/dark hoặc /identity/users/theme/light
          await apiClient.put(`/identity/users/theme/${theme}`);
      } catch (error) {
          console.error("Failed to update theme preference on server:", error);
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
                    roles: ['STUDENT'],
                    permissions: [],
                    avatar: 'https://lh3.googleusercontent.com/a/default-user',
                    darkMode: false
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