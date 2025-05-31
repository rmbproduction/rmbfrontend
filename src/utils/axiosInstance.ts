import axios from 'axios';
import { toast } from 'react-toastify';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://repairmybike.up.railway.app/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error);

    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    // Handle specific HTTP errors
    switch (error.response.status) {
      case 400:
        // Handle validation errors
        const errorDetail = error.response.data?.detail;
        if (errorDetail) {
          toast.error(errorDetail);
        } else {
          toast.error('Invalid request. Please check your input.');
        }
        break;
      case 401:
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        break;
      case 403:
        toast.error('You do not have permission to perform this action.');
        break;
      case 404:
        toast.error('Resource not found.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance; 