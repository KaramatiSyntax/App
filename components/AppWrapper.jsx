"use client";

import { useState, useEffect } from 'react';
import { useAppLoading } from '@/lib/hooks/useAppLoading'
import SplashScreen from '@/components/SplashScreen'
import TopNavbar from '@/components/TopNavbar'
import Navbar from '@/components/navbar'
import { usePathname } from 'next/navigation';
import { SecondsProvider } from './MatchCard/SecondsContext';

export default function AppWrapper({ children }) {
  const { isAppReady } = useAppLoading();
  const pathname = usePathname();

  // Add a fallback timeout to prevent infinite loading
  const [forceShow, setForceShow] = useState(false);

  // Check if we have q=install parameter
  const [hasInstallParam, setHasInstallParam] = useState(false);

  // Check if user is on login/signup page
  const isOnAuthPage = pathname === '/login';

  // Check if user is on the event page
  const isPaddingRequired = pathname !== '/events';

  useEffect(() => {
    // Check for q=install parameter
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const installParam = urlParams.get('q');
      if (installParam === 'install') {
        setHasInstallParam(true);
      }
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setForceShow(true);
    }, 10000); // Increased to 10 second timeout for PWA

    return () => clearTimeout(timeout);
  }, []);

  // Only show splash screen when app is actually loading
  const showLoadingOverlay = !isAppReady && !forceShow && !hasInstallParam;

  // Always render app structure; overlay SplashScreen if loading
  return (
    <>
      {showLoadingOverlay && (
        <div className="fixed inset-0 z-50">
          <SplashScreen showAnimatedText={isOnAuthPage} />
        </div>
      )}
      <TopNavbar />
      <SecondsProvider>
        <main className={isPaddingRequired ? "pt-16" : "pt-0"}>
          {children}
        </main>
      </SecondsProvider>
      <Navbar />
    </>
  );
}  