
import apiClient from './apiClient';
import { User, LoginCredentials, AuthResponse, UserRole, ThemeMode } from '../types';

export const authService = {
  // Đăng nhập để lấy Token
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
        const response = await apiClient.post('/api/auth/token', {
            username: credentials.email,
            password: credentials.password
        });

        const responseData = response.data;

        // Xử lý trường hợp server trả về 200 nhưng code khác 1000
        if (responseData.code !== 1000) {
            throw new Error(responseData.message || "Đăng nhập thất bại");
        }

        const token = responseData.result?.token;
        const isAuthenticated = responseData.result?.authenticated;

        if (!token || !isAuthenticated) {
            throw new Error("Xác thực thất bại hoặc không có token");
        }

        // Lưu tạm token để apiClient có thể dùng nó cho request lấy thông tin user
        localStorage.setItem('accessToken', token);

        // Gọi API lấy thông tin User chi tiết
        const user = await authService.getCurrentUser();

        return {
            user: user,
            accessToken: token,
            refreshToken: '' 
        };
    } catch (error: any) {
        console.error("Login API Error:", error);
        
        // Nếu lỗi đến từ phía server (có response)
        if (error.response?.data) {
            const serverData = error.response.data;
            // Nếu là lỗi 1006 (Unauthenticated) từ server của bạn
            if (serverData.code === 1006) {
                throw new Error("Tên đăng nhập hoặc mật khẩu không chính xác");
            }
            throw new Error(serverData.message || "Lỗi đăng nhập");
        }
        
        // Nếu không có response (lỗi mạng, timeout...)
        throw new Error(error.message || "Lỗi kết nối máy chủ");
    }
  },

  // Đăng ký tài khoản mới
  register: async (userData: any): Promise<AuthResponse> => {
    try {
        const response = await apiClient.post('/api/users', {
            username: userData.email,
            password: userData.password,
            firstName: userData.name,
            lastName: "", // Bạn có thể tách name nếu cần
            roles: [userData.role] // USER hoặc TEACHER
        });

        const responseData = response.data;
        if (responseData.code !== 1000) {
            throw new Error(responseData.message || "Đăng ký thất bại");
        }

        // Sau khi đăng ký thành công, thực hiện đăng nhập luôn
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

  // Lấy thông tin user hiện tại
  getCurrentUser: async (): Promise<User> => {
    try {
        const response = await apiClient.get('/api/users/my-info');
        const result = response.data.result;

        const mappedRoles: UserRole[] = [];
        const permissions: string[] = [];
        
        if (result.roles && Array.isArray(result.roles)) {
            result.roles.forEach((r: any) => {
                const roleName = r.name || r; // Hỗ trợ cả object role hoặc string role
                
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
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`,
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
          await apiClient.post('/api/auth/logout', { token });
      } catch (error) {
          console.error("Logout API Error:", error);
      }
  },

  // Cập nhật Theme Mode
  updateTheme: (theme: ThemeMode): void => {
      apiClient.put(`/api/users/theme/${theme}`).catch(() => {});
  },

  // Quên mật khẩu: Gửi mã OTP
  sendVerificationCode: async (email: string): Promise<boolean> => {
    try {
        const response = await apiClient.post('/api/auth/forgot-password', { email });
        return response.data.code === 1000;
    } catch (error: any) {
        console.error("Send OTP Error:", error);
        throw error.response?.data?.message || "Không thể gửi mã xác thực";
    }
  },

  // Quên mật khẩu: Xác thực mã OTP
  verifyCode: async (email: string, code: string): Promise<boolean> => {
    try {
        const response = await apiClient.post('/api/auth/verify-otp', { email, otp: code });
        return response.data.code === 1000;
    } catch (error: any) {
        console.error("Verify OTP Error:", error);
        throw error.response?.data?.message || "Mã xác thực không chính xác";
    }
  },

  // Quên mật khẩu: Đặt lại mật khẩu mới
  resetPassword: async (email: string, newPassword: string): Promise<boolean> => {
    try {
        const response = await apiClient.post('/api/auth/reset-password', { 
            email, 
            password: newPassword 
        });
        return response.data.code === 1000;
    } catch (error: any) {
        console.error("Reset Password Error:", error);
        throw error.response?.data?.message || "Không thể đặt lại mật khẩu";
    }
  },

  // Mock Google Login (Giữ nguyên vì thường cần cấu hình OAuth2 riêng biệt)
  mockGoogleLogin: async (): Promise<AuthResponse> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                user: {
                    id: 'g1',
                    name: 'Nguyễn Google',
                    email: 'nguyen.google@gmail.com',
                    roles: ['USER'],
                    permissions: [],
                    avatar: 'https://lh3.googleusercontent.com/a/default-user',
                    darkMode: false
                },
                accessToken: 'mock-google-token-xyz',
                refreshToken: 'mock-refresh-token'
            });
        }, 1200);
    });
  }
};
