import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import ScrollToTop from '../components/ScrollToTop';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <main className="min-h-screen">
        {children}
      </main>
    </>
  );
} 