'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getSocket } from '../lib/socket';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  const { fetchMe, isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (isAuthenticated) {
      const socket = getSocket();
      socket.connect();

      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-950 min-h-screen`}>{children}</body>
    </html>
  );
}
