
import axios from 'axios';
import i18n from '../i18n';

// Lấy URL API từ biến môi trường
const metaEnv = (import.meta as any).env || {};
const API_URL = metaEnv.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s timeout
});

// Request Interceptor: Tự động gắn Token và Ngôn ngữ vào Header
apiClient.interceptors.request.use(
  (config) => {
    // 1. Gắn Token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Gắn Ngôn ngữ hiện tại
    const currentLanguage = i18n.language || 'vi';
    config.headers['Accept-Language'] = currentLanguage;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý lỗi toàn cục
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Kiểm tra xem đây có phải là request xác thực (đăng nhập) không
    // Chúng ta kiểm tra cả đường dẫn tương đối và tuyệt đối để đảm bảo an toàn
    const url = originalRequest.url || '';
    const isLoginRequest = url.includes('/api/auth/token') || url.endsWith('/auth/token');

    // Nếu gặp lỗi 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu KHÔNG PHẢI request đăng nhập, thì mới thực hiện logout và redirect
      // Vì nếu là request đăng nhập bị 401, nghĩa là sai user/pass, ta cần giữ user ở lại trang login
      if (!isLoginRequest) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/'; 
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
