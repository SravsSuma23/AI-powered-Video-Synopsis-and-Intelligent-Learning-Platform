import axios from 'axios';

// Base API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 120 seconds timeout (to allow Whisper transcription and metadata fallback to complete)
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returns a 401 Unauthorized, automatically log out
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      const isHashPath = window.location.hash && window.location.hash.startsWith('#');
      const currentPath = isHashPath ? window.location.hash : window.location.pathname;
      
      // Only redirect if not already on login/register page
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        // If we are using HashRouter, navigate via hash to preserve base path
        window.location.hash = '#/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
