import { toast as hotToast } from 'react-hot-toast';

interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

const defaultOptions: ToastOptions = {
  duration: 3000,
  position: 'top-right',
};

export const toast = {
  success: (message: string, options: ToastOptions = {}) => {
    hotToast.success(message, {
      ...defaultOptions,
      ...options,
    });
  },

  error: (message: string, options: ToastOptions = {}) => {
    hotToast.error(message, {
      ...defaultOptions,
      ...options,
    });
  },

  info: (message: string, options: ToastOptions = {}) => {
    hotToast(message, {
      ...defaultOptions,
      ...options,
    });
  },
}; 