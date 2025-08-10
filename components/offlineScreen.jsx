"use client";
import { useEffect, useState } from "react";

export default function OfflineScreen() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Don't render anything when online
  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f7e1e1] dark:bg-[#120101] text-center px-4">

      {/* Blurred red balls for background */}
      <div className="absolute left-10 top-10 w-[30vmin] h-[30vmin] rounded-full blur-[6rem]
      bg-red-700" />
      <div className="absolute
      bottom-10 right-10 w-[30vmin] h-[30vmin] rounded-full blur-[6rem] bg-red-600" />

      <div className="relative w-4/5 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg aspect-square">
        {/* Custom Gaming-themed Offline Icon */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative w-32 h-32">
            {/* Outer ring with animation */}
            <div className="absolute inset-0 border-4 border-red-500/30 rounded-full animate-ping"></div>
            <div className="absolute inset-2 border-4 border-red-500/50 rounded-full animate-pulse"></div>
            
            {/* Main icon container */}
            <div className="absolute inset-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            
            {/* Connection lines */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-4 bg-red-400 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-4 bg-red-400 rounded-full animate-pulse"></div>
            <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-4 h-1 bg-red-400 rounded-full animate-pulse"></div>
            <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-4 h-1 bg-red-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
      <h1
        className="mt-8 text-2xl sm:text-3xl font-semibold text-zinc-800 dark:text-white"
      >
        You're offline
      </h1>
      <p className="mt-2 text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
        Check your connection and try again.
      </p>
    </div>
  );
}