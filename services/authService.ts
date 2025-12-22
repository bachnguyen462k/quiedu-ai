
import apiClient from './apiClient';
import { User, LoginCredentials, AuthResponse, UserRole, ThemeMode } from '../types';

export const authService = {
  // Đăng nhập để lấy Token
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
        const response = await apiClient.post('/auth/token', {
            username: credentials.email,
            password: credentials.password
        });

        const responseData = response.data;

        if (responseData.code !== 1000) {
            throw new Error(responseData.message || "Đăng nhập thất bại");
        }

        const token = responseData.result?.token;
        const isAuthenticated = responseData.result?.authenticated;

        if (!token || !isAuthenticated) {
            throw new Error("Xác thực thất bại hoặc không có token");
        }

        localStorage.setItem('accessToken', token);

        const user = await authService.getCurrentUser();

        return {
            user: user,
            accessToken: token,
            refreshToken: '' 
        };
    } catch (error: any) {
        console.error("Login API Error:", error);
        
        if (error.response?.data) {
            const serverData = error.response.data;
            if (serverData.code === 1006) {
                throw new Error("Tên đăng nhập hoặc mật khẩu không chính xác");
            }
            throw new Error(serverData.message || "Lỗi đăng nhập");
        }
        
        throw new Error(error.message || "Lỗi kết nối máy chủ");
    }
  },

  // Đăng nhập bằng Google Token và Vai trò
  loginWithGoogle: async (idToken: string, roleId: string): Promise<AuthResponse> => {
    try {
        const response = await apiClient.post('/auth/google', { 
            idToken,
            roleId 
        });
        const responseData = response.data;

        if (responseData.code !== 1000) {
            throw new Error(responseData.message || "Đăng nhập Google thất bại");
        }

        const token = responseData.result?.token;
        if (!token) throw new Error("Không nhận được token từ máy chủ");

        localStorage.setItem('accessToken', token);
        const user = await authService.getCurrentUser();

        return {
            user: user,
            accessToken: token
        };
    } catch (error: any) {
        console.error("Google Login API Error:", error);
        throw new Error(error.response?.data?.message || error.message || "Lỗi xác thực Google");
    }
  },

  // Đăng ký tài khoản mới
  register: async (userData: any): Promise<AuthResponse> => {
    try {
        const response = await apiClient.post('/users', {
            username: userData.email,
            password: userData.password,
            firstName: userData.name,
            lastName: "",
            roles: [userData.role]
        });

        const responseData = response.data;
        if (responseData.code !== 1000) {
            throw new Error(responseData.message || "Đăng ký thất bại");
        }

        return await authService.login({ 
            email: userData.email, 
            password: userData.password 
        });
    } catch (error: any) {
        console.error("Register API Error:", error);
        if (error.response?.data) {
            throw error.response.data.message || "Lỗi đăng ký";
        }
        throw error.message || "Lỗi kết nối máy chủ";
    }
  },

  // Làm mới token
  refreshToken: async (): Promise<string> => {
    const currentToken = localStorage.getItem('accessToken');
    if (!currentToken) throw new Error("No token found");

    try {
        const response = await apiClient.post('/auth/refresh', {
            token: currentToken
        });
        
        const responseData = response.data;
        if (responseData.code === 1000 && responseData.result?.token) {
            const newToken = responseData.result.token;
            localStorage.setItem('accessToken', newToken);
            return newToken;
        }
        throw new Error("Refresh failed with code: " + responseData.code);
    } catch (error) {
        console.error("Refresh Token API Error:", error);
        throw error;
    }
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async (): Promise<User> => {
    try {
        const response = await apiClient.get('/users/my-info');
        const result = response.data.result;

        const mappedRoles: UserRole[] = [];
        const permissions: string[] = [];
        
        if (result.roles && Array.isArray(result.roles)) {
            result.roles.forEach((r: any) => {
                const roleName = r.name || r;
                
                if (roleName === 'ADMIN') {
                    if (!mappedRoles.includes('ADMIN')) mappedRoles.push('ADMIN');
                } else if (roleName === 'TEACHER') {
                    if (!mappedRoles.includes('TEACHER')) mappedRoles.push('TEACHER');
                } else if (roleName === 'USER' || roleName === 'STUDENT') {
                    if (!mappedRoles.includes('USER')) mappedRoles.push('USER');
                }

                if (r.permissions && Array.isArray(r.permissions)) {
                    r.permissions.forEach((p: any) => {
                        if (p.name && !permissions.includes(p.name)) {
                            permissions.push(p.name);
                        }
                    });
                }
            });
        }

        if (mappedRoles.length === 0) mappedRoles.push('USER');

        const displayName = (result.firstName || result.lastName) 
            ? `${result.lastName || ''} ${result.firstName || ''}`.trim() 
            : result.username;

        return {
            id: result.id,
            name: displayName,
            email: result.username,
            roles: mappedRoles,
            permissions: permissions,
            avatar: result.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`,
            darkMode: result.darkMode
        };
    } catch (error) {
        console.error("Get User Info Error:", error);
        throw error;
    }
  },

  // Đăng xuất
  logout: async (token: string): Promise<void> => {
      try {
          await apiClient.post('/auth/logout', { token });
      } catch (error) {
          console.error("Logout API Error:", error);
      }
  },

  // Cập nhật Theme Mode
  updateTheme: (theme: ThemeMode): void => {
      apiClient.put(`/users/theme/${theme}`).catch(() => {});
  },

  // Quên mật khẩu
  sendVerificationCode: async (email: string): Promise<boolean> => {
    try {
        const response = await apiClient.post('/auth/forgot-password', { email });
        return response.data.code === 1000;
    } catch (error: any) {
        console.error("Send OTP Error:", error);
        throw error.response?.data?.message || "Không thể gửi mã xác thực";
    }
  },

  verifyCode: async (email: string, code: string): Promise<boolean> => {
    try {
        const response = await apiClient.post('/auth/verify-otp', { email, otp: code });
        return response.data.code === 1000;
    } catch (error: any) {
        console.error("Verify OTP Error:", error);
        throw error.response?.data?.message || "Mã xác thực không chính xác";
    }
  },

  resetPassword: async (email: string, newPassword: string): Promise<boolean> => {
    try {
        const response = await apiClient.post('/auth/reset-password', { 
            email, 
            password: newPassword 
        });
        return response.data.code === 1000;
    } catch (error: any) {
        console.error("Reset Password Error:", error);
        throw error.response?.data?.message || "Không thể đặt lại mật khẩu";
    }
  }
};
