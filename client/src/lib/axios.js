import axios from 'axios';
import { useAuthStore } from '../store/authStore';

let apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (!apiBaseURL.endsWith('/api')) {
  apiBaseURL = `${apiBaseURL.replace(/\/$/, '')}/api`;
}

const axiosInstance = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Cache-Control': 'no-cache',
  },
});

// Request interceptor - attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
