import { ThemeProvider } from "@/components/theme-provider";
import { Fredoka, Titillium_Web, Bebas_Neue, Playpen_Sans } from 'next/font/google';
import './globals.css';
import OfflineScreen from '@/components/offlineScreen';
import { AlertProvider } from '@/components/AlertProvider';
import AppWrapper from '@/components/AppWrapper';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import InstallPromptHandler from '@/components/InstallPromptHandler';

// Font configuration with fallbacks and better error handling
const fredoka = Fredoka({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-fredoka',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
});

const titillium = Titillium_Web({
  weight: ['200', '300', '400', '600', '700', '900'],
  subsets: ['latin'],
  variable: '--font-titillium',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
});

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
});

const playpen = Playpen_Sans({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-playpen',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
});

export const metadata = {
  title: 'TurraniX',
  description: 'Let give your talent a chance to win... It is a platform that provides you a chance to challenge yourself. Go ahead, make your own world — a gaming world!',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TurraniX',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'oklch(0.145 0 0)' },
    { media: '(prefers-color-scheme: dark)', color: 'oklch(0.145 0 0)' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${titillium.variable} ${bebas.variable} ${playpen.variable} ${fredoka.variable}`}>
      <head>
        <link rel="icon" href="/icon.png" />
        {/* Add fallback font preloading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Add system font fallback */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @font-face {
              font-family: 'SystemFallback';
              src: local('system-ui'), local('-apple-system'), local('BlinkMacSystemFont'), local('Segoe UI'), local('Roboto'), local('Oxygen'), local('Ubuntu'), local('Cantarell'), local('Fira Sans'), local('Droid Sans'), local('Helvetica Neue'), local('sans-serif');
              font-display: swap;
            }
            .font-fallback {
              font-family: 'SystemFallback', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            }
          `
        }} />
      </head>
      <body className="font-fallback">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          

            <div className="w-[20vmin] h-[20vmin] rounded-full bg-[var(--atoll-dark)] dark:bg-[var(--scooter)] absolute left-10 top-40 -z-10 blur-[5rem]" />
            <div className="w-[20vmin] h-[20vmin] rounded-full bg-[var(--atoll)] dark:bg-[var(--eastern-blue)] absolute right-10 bottom-10 -z-10 blur-[5rem]" />
            <AlertProvider>
              <OfflineScreen />
              <ServiceWorkerRegistration />
              <InstallPromptHandler />
              <AppWrapper>
                {children}
              </AppWrapper>
            </AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}