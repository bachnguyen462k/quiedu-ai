
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import i18n from '../i18n';
import { authService } from './authService';

// Lấy URL API từ biến môi trường
const metaEnv = (import.meta as any).env || {};
const API_URL = metaEnv.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  // Cấu hình chung tiền tố /api tại đây
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s timeout
});

// Biến điều hướng để tránh vòng lặp refresh
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Request Interceptor: Tự động gắn Token và Ngôn ngữ vào Header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const currentLanguage = i18n.language || 'vi';
    config.headers['Accept-Language'] = currentLanguage;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý làm mới token (1006) và lỗi 401
apiClient.interceptors.response.use(
  (response) => {
    const originalRequest = response.config;
    const url = originalRequest.url || '';
    // Cập nhật: không còn tiền tố /api trong so sánh chuỗi vì url lúc này là tương đối
    const isLoginRequest = url.includes('/auth/token');
    const isRefreshRequest = url.includes('/auth/refresh');

    // Kiểm tra mã code 1006 trong response body (Token hết hạn theo logic backend)
    if (response.data && response.data.code === 1006 && !isLoginRequest && !isRefreshRequest) {
      if (!isRefreshing) {
        isRefreshing = true;
        authService.refreshToken()
          .then((newToken) => {
            isRefreshing = false;
            onRefreshed(newToken);
          })
          .catch((err) => {
            isRefreshing = false;
            handleLogout();
          });
      }

      // Trả về một promise chờ token mới
      return new Promise((resolve) => {
        addRefreshSubscriber((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (!originalRequest) {
        return Promise.reject(error);
    }

    const url = originalRequest.url || '';
    const isLoginRequest = url.includes('/auth/token');
    const isRefreshRequest = url.includes('/auth/refresh');

    // 1. Nếu gặp lỗi 401 khi đang gọi API Refresh -> Logout ngay
    if (error.response?.status === 401 && isRefreshRequest) {
        handleLogout();
        return Promise.reject(error);
    }

    // 2. Nếu API thông thường trả về 401 hoặc mã lỗi đặc biệt trong data (nếu axios ném lỗi)
    const serverData = error.response?.data as any;
    if ((error.response?.status === 401 || serverData?.code === 1006) && !isLoginRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await authService.refreshToken();
          isRefreshing = false;
          onRefreshed(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          handleLogout();
          return Promise.reject(refreshError);
        }
      }

      return new Promise((resolve) => {
        addRefreshSubscriber((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(originalRequest));
        });
      });
    }
    
    return Promise.reject(error);
  }
);

function handleLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  if (window.location.hash !== '#/login' && window.location.pathname !== '/login') {
    window.location.href = '/'; 
  }
}

export default apiClient;
