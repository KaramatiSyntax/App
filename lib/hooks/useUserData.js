"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

const userDataCache = new Map();
let globalUserData = null;
let globalNotifications = [];
let isFetching = false;
let fetchPromise = null;
let lastFetchTime = 0;
const FETCH_COOLDOWN = 5000; // Reduced from 10 seconds to 5 seconds
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 12; // Increased from 6 to 12 requests per minute

export const useUserData = () => {
  const [userData, setUserData] = useState(globalUserData);
  const [loading, setLoading] = useState(true); // Always start with loading true
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  // Fetch user data from /api/users using cookie/session
  const fetchUserData = useCallback(async () => {
    // If already fetching, wait for the existing promise
    if (isFetching && fetchPromise) {
      try {
        const data = await fetchPromise;
        if (mountedRef.current) {
          setUserData(data.user);
          setError(null);
          setLoading(false);
        }
        return;
      } catch (err) {
        if (mountedRef.current) {
          setError(err.message);
          setUserData(null);
          setLoading(false);
        }
        return;
      }
    }
    
    // If we have cached data and it's recent, use it
    if (globalUserData && userDataCache.has('me')) {
      const cachedData = userDataCache.get('me');
      const cacheAge = Date.now() - (cachedData.timestamp || 0);
      if (cacheAge < 30000) { // Use cache if less than 30 seconds old
        if (mountedRef.current) {
          setUserData(cachedData.user);
          setError(null);
          setLoading(false);
        }
        return;
      }
    }

    // Prevent multiple simultaneous requests
    if (isFetching) {
      return;
    }

    // Check cooldown period
    const now = Date.now();
    if (now - lastFetchTime < FETCH_COOLDOWN) {
      console.log('useUserData - Request blocked by cooldown');
      return;
    }

    // Check rate limiting
    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
      console.log('useUserData - Request blocked by rate limit');
      return;
    }

    isFetching = true;
    setLoading(true);
    setError(null);
    lastFetchTime = now;
    requestCount++;
    
    fetchPromise = (async () => {
      try {
        // Add timeout to prevent infinite loading
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch('/api/users/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // If 401 or 404, treat as not authenticated
          if (response.status === 401 || response.status === 404) {
            if (mountedRef.current) {
              setUserData(null);
              setError('Not authenticated');
              setLoading(false);
            }
            globalUserData = null;
            globalNotifications = [];
            userDataCache.delete('me');
            return;
          }
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }
      
        const data = await response.json();
        
        console.log('useUserData - Authentication check:', {
          authenticated: !!data.user,
          hasNotifications: !!(data.notifications && data.notifications.length > 0),
          userEmail: data.user?.email
        });
        
        // Update global state with timestamp
        globalUserData = data.user;
        globalNotifications = data.notifications || [];
        userDataCache.set('me', { ...data, timestamp: Date.now() });
          
        if (mountedRef.current) {
          setUserData(data.user);
          setError(null);
          setLoading(false);
        }
        
        return data;
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('useUserData - Fetch error:', err);
        
        if (mountedRef.current) {
          setError(err.message || 'Network error');
          setUserData(null);
          setLoading(false);
        }
        throw err;
      } finally {
        isFetching = false;
        fetchPromise = null;
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    })();

    try {
      await fetchPromise;
    } catch (err) {
      // Error already handled above
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    // Clear cache and force refresh
    userDataCache.delete('me');
    globalUserData = null;
    globalNotifications = [];
    lastFetchTime = 0; // Reset cooldown for manual refresh
    await fetchUserData();
  }, [fetchUserData]);

  // Only fetch user data on mount, and only once
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchUserData();
    }
    
    // Reset request counter every minute
    const resetInterval = setInterval(() => {
      requestCount = 0;
    }, 60000);
    
    return () => {
      mountedRef.current = false;
      clearInterval(resetInterval);
    };
  }, [fetchUserData]);

  // Add a timeout to prevent infinite loading in PWA
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && mountedRef.current) {
        console.log('useUserData - Timeout reached, forcing loading to false');
        setLoading(false);
        if (!userData) {
          setUserData(null);
          setError('Authentication timeout');
        }
      }
    }, 15000); // 15 second timeout for PWA

    return () => clearTimeout(timeout);
  }, [loading, userData]);

  return {
    userData,
    loading,
    error,
    refreshUserData,
    // Expose notifications from the same request
    notifications: globalNotifications
  };
}; 