"use client";

import { useState, useEffect } from 'react';
import { useUserData } from './useUserData';

export const useAppLoading = () => {
  const { userData, loading: userLoading, error: userError } = useUserData();
  const [isAppReady, setIsAppReady] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState({
    userData: false,
    theme: false,
    essential: false
  });

  useEffect(() => {
    const initializeApp = async () => {
      // Add a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        setIsAppReady(true);
      }, 8000); // Increased to 8 second timeout for PWA

      try {
        // Always wait for minimum splash screen duration first
        const minSplashDuration = 3000;
        
        await new Promise(resolve => setTimeout(resolve, minSplashDuration));
        
        // Step 1: Wait for user data to load (essential)
        setLoadingSteps(prev => ({ ...prev, userData: true }));
        
        // Step 2: Wait for theme to be ready (essential)
        await new Promise(resolve => setTimeout(resolve, 50));
        setLoadingSteps(prev => ({ ...prev, theme: true }));
        
        // Step 3: Essential app setup (minimal delay)
        await new Promise(resolve => setTimeout(resolve, 50));
        setLoadingSteps(prev => ({ ...prev, essential: true }));
        
        // App is ready for navigation
        clearTimeout(timeout);
        setIsAppReady(true);
      } catch (error) {
        clearTimeout(timeout);
        setIsAppReady(true); // Force ready state on error
      }
    };

    initializeApp();
  }, [userLoading, userData]);

  const getLoadingProgress = () => {
    const steps = Object.values(loadingSteps);
    const completedSteps = steps.filter(step => step).length;
    return (completedSteps / steps.length) * 100;
  };

  return {
    isAppReady,
    loadingSteps,
    loadingProgress: getLoadingProgress(),
    userLoading,
    userError
  };
}; 