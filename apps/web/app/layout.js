import { Inter } from 'next/font/google';
import ThemeProvider from '../components/ThemeProvider';
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} bg-slate-950 min-h-screen`}>
        <ThemeProvider>{children}</ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
