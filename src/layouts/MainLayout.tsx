import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import ScrollToTop from '../components/ScrollToTop';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
} 