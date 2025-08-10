"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUserData } from './useUserData';

export const useRouteLoading = () => {
  const pathname = usePathname();
  const { userData } = useUserData();
  const [routeData, setRouteData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(new Set());
  const hasLoadedRef = useRef(new Set());
  const fetchingRef = useRef(new Set()); // Track ongoing requests
  const cacheRef = useRef(new Map()); // Cache for API responses

  // Define what data each route needs
  const routeRequirements = {
    '/': {
      matches: ['upcoming', 'completed', 'running'],
      notifications: false,
      wallet: false
    },
    '/matches': {
      matches: ['upcoming', 'completed', 'running'],
      notifications: false,
      wallet: false
    },
    '/wallet': {
      matches: [],
      notifications: false,
      wallet: true
    },
    '/profile': {
      matches: [],
      notifications: true,
      wallet: false
    },
    '/notifications': {
      matches: [],
      notifications: true,
      wallet: false
    },
    '/events': {
      matches: [],
      notifications: false,
      wallet: false
    },
    '/admin': {
      matches: [],
      notifications: false,
      wallet: false
    },
    '/manager': {
      matches: [],
      notifications: false,
      wallet: false
    }
  };



  // Load data for current route
  const loadRouteData = useCallback(async () => {
    // Get current route requirements inline to avoid circular dependencies
    const getCurrentRouteRequirements = () => {
      // Find the matching route or use default
      for (const [route, requirements] of Object.entries(routeRequirements)) {
        if (pathname === route || pathname.startsWith(route + '/')) {
          return requirements;
        }
      }
      // Default requirements for unknown routes
      return {
        matches: [],
        notifications: false,
        wallet: false
      };
    };

    const requirements = getCurrentRouteRequirements();
    const routeKey = pathname;
    
    // Skip if already loaded or currently fetching
    if (hasLoadedRef.current.has(routeKey) || fetchingRef.current.has(routeKey)) {
      return;
    }

    // Mark as fetching
    fetchingRef.current.add(routeKey);
    setIsLoading(true);

    try {
      const promises = [];

      // Load matches if required with caching
      if (requirements.matches.length > 0) {
        requirements.matches.forEach(status => {
          const cacheKey = `matches-${status}`;
          const cachedData = cacheRef.current.get(cacheKey);
          
          if (cachedData && Date.now() - cachedData.timestamp < 30000) { // 30 second cache
            // Use cached data
            promises.push(Promise.resolve({ 
              type: 'matches', 
              status, 
              data: cachedData.data 
            }));
          } else {
            // Fetch fresh data
            promises.push(
              fetch(`/api/matches?status=${status}`)
                .then(res => res.json())
                .then(data => {
                  // Cache the response
                  cacheRef.current.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                  });
                  return { type: 'matches', status, data };
                })
                .catch(err => ({ type: 'matches', status, error: err.message }))
            );
          }
        });
      }

      // Load wallet data if required with caching
      if (requirements.wallet && userData?.email) {
        const cacheKey = `wallet-${userData.email}`;
        const cachedData = cacheRef.current.get(cacheKey);
        
        if (cachedData && Date.now() - cachedData.timestamp < 60000) { // 1 minute cache
          promises.push(Promise.resolve({ 
            type: 'wallet', 
            data: cachedData.data 
          }));
        } else {
          promises.push(
            fetch(`/api/withdraws?userEmail=${userData.email}&limit=50`)
              .then(res => res.json())
              .then(data => {
                // Cache the response
                cacheRef.current.set(cacheKey, {
                  data,
                  timestamp: Date.now()
                });
                return { type: 'wallet', data };
              })
              .catch(err => ({ type: 'wallet', error: err.message }))
          );
        }
      }

      // Load notifications if required with caching
      if (requirements.notifications && userData?.email) {
        const cacheKey = `notifications-${userData.email}`;
        const cachedData = cacheRef.current.get(cacheKey);
        
        if (cachedData && Date.now() - cachedData.timestamp < 30000) { // 30 second cache
          promises.push(Promise.resolve({ 
            type: 'notifications', 
            data: cachedData.data 
          }));
        } else {
          promises.push(
            fetch(`/api/notifications?userEmail=${userData.email}`)
              .then(res => res.json())
              .then(data => {
                // Cache the response
                cacheRef.current.set(cacheKey, {
                  data,
                  timestamp: Date.now()
                });
                return { type: 'notifications', data };
              })
              .catch(err => ({ type: 'notifications', error: err.message }))
          );
        }
      }

      // Wait for all promises to resolve
      const results = await Promise.all(promises);
      
      // Process results
      const newRouteData = {};
      results.forEach(result => {
        if (result.type === 'matches') {
          if (!newRouteData.matches) newRouteData.matches = {};
          if (result.data) {
            newRouteData.matches[result.status] = result.data;
          }
        } else if (result.type === 'wallet') {
          newRouteData.wallet = result.data || [];
        } else if (result.type === 'notifications') {
          newRouteData.notifications = result.data || [];
        }
      });

      setRouteData(prev => ({
        ...prev,
        [routeKey]: newRouteData
      }));

      hasLoadedRef.current.add(routeKey);
      setHasLoaded(prev => new Set([...prev, routeKey]));

    } catch (error) {
      console.error('Error loading route data:', error);
    } finally {
      fetchingRef.current.delete(routeKey);
      setIsLoading(false);
    }
  }, [pathname, userData?.email]);

  // Load data when route changes
  useEffect(() => {
    if (pathname) {
      loadRouteData();
    }
  }, [loadRouteData]);

  // Get current route data
  const getCurrentRouteData = () => {
    return routeData[pathname] || {};
  };

  // Preload data for a specific route
  const preloadRoute = async (route) => {
    const requirements = routeRequirements[route];
    if (!requirements) return;

    // Preload matches with caching
    if (requirements.matches.length > 0) {
      requirements.matches.forEach(status => {
        const cacheKey = `matches-${status}`;
        const cachedData = cacheRef.current.get(cacheKey);
        
        // Only fetch if not cached or cache is expired
        if (!cachedData || Date.now() - cachedData.timestamp >= 30000) {
          fetch(`/api/matches?status=${status}`)
            .then(res => res.json())
            .then(data => {
              // Cache the response
              cacheRef.current.set(cacheKey, {
                data,
                timestamp: Date.now()
              });
            })
            .catch(() => {});
        }
      });
    }
  };

  // Clear cache when user data changes
  useEffect(() => {
    if (userData?.email) {
      // Clear user-specific cache when user changes
      const keysToDelete = [];
      cacheRef.current.forEach((value, key) => {
        if (key.includes(userData.email)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => cacheRef.current.delete(key));
    }
  }, [userData?.email]);

  return {
    isLoading,
    routeData: getCurrentRouteData(),
    loadRouteData,
    preloadRoute,
    hasLoaded: hasLoadedRef.current.has(pathname)
  };
}; 