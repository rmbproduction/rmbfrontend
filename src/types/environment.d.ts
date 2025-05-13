/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="react-router-dom" />
/// <reference types="react-toastify" />

declare module 'react-toastify' {
  import { FC, ReactNode } from 'react';
  
  export interface ToastOptions {
    position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
    autoClose?: number | false;
    hideProgressBar?: boolean;
    closeOnClick?: boolean;
    pauseOnHover?: boolean;
    draggable?: boolean;
    progress?: number;
    theme?: 'light' | 'dark' | 'colored';
    type?: 'info' | 'success' | 'warning' | 'error' | 'default';
  }

  export interface ToastContainerProps extends ToastOptions {
    enableMultiContainer?: boolean;
    containerId?: string | number;
    limit?: number;
    newestOnTop?: boolean;
    rtl?: boolean;
  }

  export const ToastContainer: FC<ToastContainerProps>;
  export const toast: {
    (message: ReactNode, options?: ToastOptions): string | number;
    success(message: ReactNode, options?: ToastOptions): string | number;
    info(message: ReactNode, options?: ToastOptions): string | number;
    warn(message: ReactNode, options?: ToastOptions): string | number;
    warning(message: ReactNode, options?: ToastOptions): string | number;
    error(message: ReactNode, options?: ToastOptions): string | number;
    dark(message: ReactNode, options?: ToastOptions): string | number;
    dismiss(id?: string | number): void;
    isActive(id: string | number): boolean;
    update(id: string | number, options?: ToastOptions): void;
    done(id: string | number): void;
    configure(options: ToastOptions): void;
  };
}

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { [key: string]: string };
  export default classes;
} 