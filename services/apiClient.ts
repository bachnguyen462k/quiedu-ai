import axios from 'axios';

// Lấy URL API từ biến môi trường (cần tạo file .env: VITE_API_URL=http://localhost:your-port/api)
// Sử dụng fallback an toàn nếu import.meta.env không tồn tại để tránh lỗi runtime
const metaEnv = (import.meta as any).env || {};
const API_URL = metaEnv.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s timeout
});

// Request Interceptor: Tự động gắn Token vào Header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý lỗi toàn cục (ví dụ: 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 (Unauthorized) và chưa thử retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Xử lý logout hoặc refresh token tại đây
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      // Có thể chuyển hướng về trang login hoặc dispatch một event logout
      window.location.href = '/'; 
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;