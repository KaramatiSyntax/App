'use client';

import { useEffect, useState } from 'react';

// Cookie utility functions
const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const setCookie = (name, value, hours = 5) => {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + (hours * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  console.log(`Cookie set: ${name}=${value}, expires: ${expires.toUTCString()}`);
};

const deleteCookie = (name) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  console.log(`Cookie deleted: ${name}`);
};

export default function InstallPromptHandler() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Check if app is already installed (running in standalone mode)
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsStandalone(standalone);
      console.log('Standalone check:', standalone);
      return standalone;
    };

    // Check for q=install parameter using window.location
    const urlParams = new URLSearchParams(window.location.search);
    const installParam = urlParams.get('q');
    
    console.log('InstallPromptHandler - checking for q=install:', installParam);
    
    if (installParam === 'install') {
      console.log('InstallPromptHandler - showing install prompt via URL parameter');
      setShowInstallPrompt(true);
      // Remove the parameter from URL without page reload
      const url = new URL(window.location);
      url.searchParams.delete('q');
      window.history.replaceState({}, '', url);
    } else {
      // Check if we should show automatic install prompt
      const shouldShowAutoPrompt = () => {
        // Don't show if already installed
        if (checkStandalone()) {
          console.log('App is already installed (standalone mode)');
          return false;
        }
        
        // Don't show if we've already shown it in this session
        if (hasShownPrompt) {
          console.log('Prompt already shown in this session');
          return false;
        }
        
        // Check if user has dismissed it before (stored in cookie)
        const dismissed = getCookie('pwa-install-dismissed');
        console.log('Checking dismissed cookie:', dismissed);
        
        if (dismissed) {
          const dismissedTime = parseInt(dismissed);
          const now = Date.now();
          const timeDiff = now - dismissedTime;
          const fiveHours = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
          
          console.log('Dismissed time:', dismissedTime, 'Current time:', now, 'Time diff:', timeDiff, 'Five hours:', fiveHours);
          
          // Show again after 5 hours
          if (timeDiff < fiveHours) {
            console.log('Prompt dismissed recently, not showing again');
            return false;
          } else {
            console.log('Dismissal expired, can show again');
          }
        }
        
        console.log('All conditions met, can show prompt');
        return true;
      };

      // Show automatic prompt after a delay if conditions are met
      if (shouldShowAutoPrompt()) {
        console.log('Setting up automatic prompt display');
        setTimeout(() => {
          if (deferredPrompt && !isStandalone) {
            console.log('InstallPromptHandler - showing automatic install prompt');
            setShowInstallPrompt(true);
            setHasShownPrompt(true);
          }
        }, 3000); // Show after 3 seconds
      }
    }
  }, [isClient, deferredPrompt, hasShownPrompt, isStandalone]);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('InstallPromptHandler - beforeinstallprompt event received');
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      setHasShownPrompt(true);
      
      // Show success notification
      setShowSuccessNotification(true);
      
      // Auto-hide success notification after 5 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If no deferred prompt, show instructions for manual installation
      showManualInstallInstructions();
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        // Success notification will be shown by the appinstalled event
      } else {
        console.log('User dismissed the install prompt');
      }

      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
      showManualInstallInstructions();
    }
  };

  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    let instructions = '';

    if (isIOS) {
      instructions = 'Tap the Share button (📤) and select "Add to Home Screen"';
    } else if (isAndroid && isChrome) {
      instructions = 'Tap the menu (⋮) and select "Install app" or "Add to Home screen"';
    } else if (isAndroid && isFirefox) {
      instructions = 'Tap the menu (⋮) and select "Install app"';
    } else if (isSafari) {
      instructions = 'Tap the Share button and select "Add to Home Screen"';
    } else {
      instructions = 'Look for the install icon in your browser\'s address bar or menu';
    }

    alert(`To install TurraniX:\n\n${instructions}`);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    console.log('User dismissed install prompt, setting cookie');
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
    
    // Store dismissal time in cookie (5 hours timeout)
    setCookie('pwa-install-dismissed', Date.now().toString(), 5);
    
    // Also set a session flag to prevent showing again in this session
    setHasShownPrompt(true);
  };

  const handleSuccessDismiss = () => {
    setShowSuccessNotification(false);
  };

  if (!isClient) {
    return null;
  }

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              {/* App Icon */}
              <div className="mx-auto mb-4">
                <img 
                  src="/icon.png" 
                  alt="TurraniX" 
                  className="w-20 h-20 rounded-2xl shadow-lg mx-auto"
                />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Install TurraniX
              </h2>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Get quick access to matches, events, and your wallet. Install our app for the best gaming experience!
              </p>

              {/* Features List */}
              <div className="text-left mb-6 space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  Play matches offline
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  Instant notifications
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  Fast loading times
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  App-like experience
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  {deferredPrompt ? 'Install App' : 'Install Now'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Not Now
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-[999999] max-w-sm animate-in slide-in-from-top-2">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="font-semibold">App Installed Successfully!</h3>
              <p className="text-sm opacity-90 mt-1">
                TurraniX has been added to your home screen. You can now access it like a native app!
              </p>
            </div>
            <button
              onClick={handleSuccessDismiss}
              className="ml-4 text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
} 