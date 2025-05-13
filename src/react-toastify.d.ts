import { ReactNode } from 'react';

declare module 'react-toastify' {
  export interface ToastOptions {
    position?: any;
    autoClose?: number | false;
    closeOnClick?: boolean;
    pauseOnHover?: boolean;
    draggable?: boolean;
    closeButton?: boolean | ReactNode;
    type?: 'info' | 'success' | 'warning' | 'error' | 'default';
    hideProgressBar?: boolean;
    isLoading?: boolean;
    render?: ReactNode;
    [key: string]: any;
  }

  export type ToastContent = ReactNode;

  export interface Toast {
    (content: ToastContent, options?: ToastOptions): string | number;
    info(content: ToastContent, options?: ToastOptions): string | number;
    success(content: ToastContent, options?: ToastOptions): string | number;
    warning(content: ToastContent, options?: ToastOptions): string | number;
    error(content: ToastContent, options?: ToastOptions): string | number;
    loading(content: ToastContent, options?: ToastOptions): string | number;
    dismiss(id?: string | number): void;
    update(id: string | number, options: ToastOptions): void;
    configure(options: ToastOptions): void;
  }

  export const toast: Toast;
} 