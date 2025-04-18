import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false  // Ensure credentials aren't sent for CORS requests
});

// Add request interceptor to add authorization token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(
      error.response?.data || { error: 'Serverda xatolik yuz berdi' }
    );
  }
);

// Authentication service
export const auth = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  verifyToken: () => apiClient.get('/auth/verify'),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
};

// User service
export const user = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (userData) => apiClient.put('/users/profile', userData),
  changePassword: (passwords) => apiClient.post('/users/change-password', passwords),
};

// Scan service
export const scan = {
  startScan: (url) => apiClient.post('/scan/start', { url }),
  getScanStatus: (scanId) => apiClient.get(`/scan/status/${scanId}`),
  getScanResult: (scanId) => apiClient.get(`/scan/result/${scanId}`),
  getScanById: (scanId) => apiClient.get(`/scan/${scanId}`),
  getScanHistory: () => apiClient.get('/scan/history'),
  getDashboardStats: () => apiClient.get('/scan/stats'),
  getVulnerabilities: (scanId) => apiClient.get(`/scan/${scanId}/vulnerabilities`),
  getScanReport: (scanId, format = 'pdf') => 
    apiClient.get(`/report/export/${scanId}?format=${format}`, {
      responseType: 'blob',
    }),
  generateReport: (scanId) => apiClient.post(`/report/generate/${scanId}`),
  cancelScan: (scanId) => apiClient.post(`/scan/${scanId}/cancel`),
};

// Export default object with all services
export default {
  auth,
  user,
  scan,
}; 