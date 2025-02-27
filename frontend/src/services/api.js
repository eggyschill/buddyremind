// src/services/api.js
import axios from 'axios';

// Create an axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration or unauthorized
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Redirect to login if token is invalid or expired
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => {
    localStorage.removeItem('token');
    return api.get('/auth/logout');
  },
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/update-details', userData),
  updatePassword: (passwordData) => api.put('/auth/update-password', passwordData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`)
};

// Reminder services
export const reminderService = {
  getReminders: (filters = {}) => {
    // Convert filters object to query params
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    
    return api.get(`/reminders?${params.toString()}`);
  },
  getReminder: (id) => api.get(`/reminders/${id}`),
  createReminder: (reminderData) => api.post('/reminders', reminderData),
  updateReminder: (id, reminderData) => api.put(`/reminders/${id}`, reminderData),
  deleteReminder: (id) => api.delete(`/reminders/${id}`),
  toggleComplete: (id, note = '') => api.put(`/reminders/${id}/complete`, { note }),
  snoozeReminder: (id, snoozeDuration, note = '') => 
    api.put(`/reminders/${id}/snooze`, { snoozeDuration, note }),
  getReminderAnalytics: (period = '30days') => 
    api.get(`/reminders/analytics?period=${period}`)
};

// Buddy services
export const buddyService = {
  getDefaultBuddies: () => api.get('/buddies/default'),
  getUserBuddy: () => api.get('/users/buddy'),
  updateUserBuddy: (buddyId) => api.put('/users/buddy', { buddyId }),
  customizeBuddy: (buddyId, buddyData) => api.put(`/buddies/${buddyId}`, buddyData)
};

// User stats services
export const statsService = {
  getUserStats: () => api.get('/users/stats'),
  getDashboardStats: () => api.get('/users/dashboard-stats')
};

export default api;
