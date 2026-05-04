import { Inter } from 'next/font/google';
import ThemeProvider from '../components/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TeamHub — Collaborative Team Platform',
  description: 'Manage shared goals, announcements, and action items in real time.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = {
  themeColor: '#020617',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} bg-slate-950 min-h-screen`}>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' },
              error: { style: { background: '#7f1d1d', color: '#fecaca', border: '1px solid #991b1b' } },
              success: { style: { background: '#064e3b', color: '#a7f3d0', border: '1px solid #065f46' } },
            }}
          />
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      registration.unregister();
                    }
                  }).then(() => {
                    navigator.serviceWorker.register('/sw.js').catch(() => {});
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
