import axios, { AxiosError } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/codelearning';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Queue to handle concurrent 401 errors
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response Interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data as ApiResponse<any>;

    // Handle global API response wrapper
    if (data && typeof data === 'object' && 'code' in data) {
      // 1000 is default success code, 200 is used by the Contest module
      if (data.code === 1000 || data.code === 200) {
        return response;
      }
      // Return custom API error
      const apiError = new Error(data.message || 'API Error') as any;
      apiError.code = data.code;
      apiError.status = data.status;
      return Promise.reject(apiError);
    }
    return response;
  },
  async (error: AxiosError) => {
    // Overwrite error message with backend message if available
    if (error.response?.data) {
      const data = error.response.data as any;
      if (data && typeof data === 'object' && data.message && typeof data.message === 'string') {
        error.message = data.message;
      }
    }

    // Global Toast for Rate Limit (429)
    if (error.response?.status === 429) {
      toast.error(error.message, {
        duration: 4000,
        id: 'rate-limit-error', // Prevent duplicate toasts from overlapping
      });
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Authentication failures must reach the form without a refresh attempt.
    const requestPath = `/${originalRequest.url?.split('?')[0] ?? ''}`;
    if (['/auth/login', '/auth/register', '/auth/google', '/auth/refresh']
      .some((path) => requestPath.endsWith(path))) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        axios
          .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
          .then(() => {
            processQueue(null);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err);
            // If token refresh fails, the session is expired.
            // Redirect to login if on protected routes to prevent loops
            const pathname = window.location.pathname;
            if (pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
              window.location.href = '/login';
            }
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
