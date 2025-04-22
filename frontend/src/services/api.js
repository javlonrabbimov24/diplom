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
    }).then(response => {
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from content-disposition header or set default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `report-${scanId}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    }),
  generateReport: (scanId) => apiClient.post(`/report/generate/${scanId}`),
  cancelScan: (scanId) => apiClient.post(`/scan/${scanId}/cancel`),
  
  // Calculate the approximate progress of a scan based on its status and timing
  calculateScanProgress: (scanData) => {
    if (!scanData) return 0;
    
    // Return 100% for completed scans
    if (scanData.status === 'completed') return 100;
    
    // Return 0% for queued scans
    if (scanData.status === 'queued') return 5;
    
    // Calculate progress for in_progress scans
    if (scanData.status === 'in_progress') {
      const now = new Date();
      const startTime = new Date(scanData.createdAt);
      const elapsedMs = now - startTime;
      
      // Estimate: average scan takes about 90 seconds
      // Cap at 95% - the last 5% is for report generation
      const estimatedProgress = Math.min(95, (elapsedMs / 90000) * 100);
      return Math.max(10, estimatedProgress); // Minimum 10% when in progress
    }
    
    // For any other status (failed, cancelled)
    return 0;
  }
};

// Export default object with all services
export default {
  auth,
  user,
  scan,
}; 