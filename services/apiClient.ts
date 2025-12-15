import axios from 'axios';
import i18n from '../i18n';

// Lấy URL API từ biến môi trường
const metaEnv = (import.meta as any).env || {};
const API_URL = metaEnv.VITE_API_URL || 'http://localhost:8081';

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

    if (error.response?.status === 401 && !originalRequest._retry) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/'; 
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;