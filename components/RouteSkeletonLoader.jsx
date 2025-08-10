"use client";

import { usePathname } from 'next/navigation';

export default function RouteSkeletonLoader() {
  const pathname = usePathname();

  // Add console log to verify this component is being rendered
  console.log('RouteSkeletonLoader rendered with dark theme', { pathname });

  // Simple loading skeleton with dark theme (black backgrounds) - using !important to override theme
  const SimpleSkeleton = () => (
    <div className="!bg-gradient-to-br !from-gray-900 !to-black min-h-screen" data-skeleton="dark-theme">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-blue-200 rounded animate-pulse mb-4 w-1/3"></div>
            <div className="h-4 bg-blue-200 rounded animate-pulse w-1/2"></div>
        </div>

          {/* Content grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
              <div key={i} className="!bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-md border !border-gray-700/30">
                {/* Card header */}
              <div className="flex items-center justify-between mb-4">
                  <div className="h-4 bg-blue-200 rounded animate-pulse w-24"></div>
                  <div className="h-4 bg-blue-200 rounded animate-pulse w-16"></div>
                </div>
                
                {/* Card content */}
                <div className="space-y-3">
                  <div className="h-4 bg-blue-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-blue-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-blue-200 rounded animate-pulse w-1/2"></div>
        </div>

                {/* Card footer */}
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-200 rounded-full animate-pulse"></div>
                    <div className="h-4 bg-blue-200 rounded animate-pulse w-16"></div>
                  </div>
                  <div className="h-8 bg-blue-200 rounded animate-pulse w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Profile skeleton
  const ProfileSkeleton = () => (
    <div className="!bg-gradient-to-br !from-gray-900 !to-black min-h-screen" data-skeleton="dark-theme">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile header */}
          <div className="!bg-gray-800/90 backdrop-blur-sm rounded-lg p-8 mb-8 shadow-md border !border-gray-700/30">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-blue-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-6 bg-blue-200 rounded animate-pulse w-48 mb-3"></div>
                <div className="h-4 bg-blue-200 rounded animate-pulse w-32 mb-2"></div>
                <div className="h-4 bg-blue-200 rounded animate-pulse w-24"></div>
              </div>
            </div>
        </div>

          {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
              <div key={i} className="!bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-md text-center border !border-gray-700/30">
                <div className="w-12 h-12 bg-blue-200 rounded-full animate-pulse mx-auto mb-4"></div>
                <div className="h-5 bg-blue-200 rounded animate-pulse w-20 mx-auto mb-2"></div>
                <div className="h-4 bg-blue-200 rounded animate-pulse w-16 mx-auto"></div>
            </div>
          ))}
        </div>

          {/* Content section */}
          <div className="!bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-md border !border-gray-700/30">
            <div className="h-5 bg-blue-200 rounded animate-pulse w-32 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 !bg-gray-700/50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-200 rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-blue-200 rounded animate-pulse w-40 mb-2"></div>
                    <div className="h-3 bg-blue-200 rounded animate-pulse w-24"></div>
                  </div>
                  <div className="h-8 bg-blue-200 rounded animate-pulse w-20"></div>
                </div>
              ))}
              </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Wallet skeleton
  const WalletSkeleton = () => (
    <div className="!bg-gradient-to-br !from-gray-900 !to-black min-h-screen" data-skeleton="dark-theme">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Wallet header */}
          <div className="text-center mb-8">
            <div className="h-8 bg-blue-200 rounded animate-pulse w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-blue-200 rounded animate-pulse w-32 mx-auto"></div>
        </div>

          {/* Balance card */}
          <div className="!bg-gray-800/90 backdrop-blur-sm rounded-lg p-8 mb-8 shadow-md border !border-gray-700/30">
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-200 rounded-full animate-pulse mx-auto mb-4"></div>
              <div className="h-6 bg-blue-200 rounded animate-pulse w-32 mx-auto mb-2"></div>
              <div className="h-4 bg-blue-200 rounded animate-pulse w-48 mx-auto"></div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center space-x-4 mb-8">
            <div className="h-12 bg-blue-200 rounded-lg animate-pulse w-32"></div>
            <div className="h-12 bg-blue-200 rounded-lg animate-pulse w-32"></div>
          </div>

          {/* Transaction history */}
          <div className="!bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 shadow-md border !border-gray-700/30">
            <div className="h-5 bg-blue-200 rounded animate-pulse w-48 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 !bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-200 rounded-full animate-pulse"></div>
                    <div>
                      <div className="h-4 bg-blue-200 rounded animate-pulse w-32 mb-2"></div>
                      <div className="h-3 bg-blue-200 rounded animate-pulse w-24"></div>
                    </div>
                  </div>
                  <div className="h-5 bg-blue-200 rounded animate-pulse w-20"></div>
            </div>
          ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Return appropriate skeleton based on route
  if (pathname === '/profile') {
    return <ProfileSkeleton />;
  } else if (pathname === '/wallet') {
    return <WalletSkeleton />;
  } else {
    return <SimpleSkeleton />;
  }
} 