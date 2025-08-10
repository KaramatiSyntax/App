"use client";

import { useState, useEffect } from 'react';
import { useUserData } from "@/lib/hooks/useUserData";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PushNotificationPermission() {
  const { userData } = useUserData();
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userData?.user) {
      checkPermissionStatus();
      checkSubscription();
    }
  }, [userData?.user]);

  const checkPermissionStatus = () => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  };

  const checkSubscription = async () => {
    if (!userData?.user?.emailAddresses?.[0]?.emailAddress) return;

    try {
      const response = await fetch(`/api/subscription?userEmail=${userData.user.emailAddresses[0].emailAddress}`);
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setError('Push notifications are not supported in this browser');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult === 'granted') {
        await subscribeToPushNotifications();
      } else if (permissionResult === 'denied') {
        setError('Notification permission was denied. You can enable it manually in your browser settings.');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setError('Failed to request notification permission');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPushNotifications = async () => {
    if (!userData?.user?.emailAddresses?.[0]?.emailAddress) {
      setError('User email not available');
      return;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'your-vapid-public-key')
      });

      // Save subscription to server
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userData.user.emailAddresses[0].emailAddress,
          endpoint: pushSubscription.endpoint,
          keys: {
            auth: arrayBufferToBase64(pushSubscription.getKey('auth')),
            p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh'))
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        setSuccess('Push notifications enabled successfully! You will now receive notifications for important updates.');
        setShowPrompt(false);
      } else {
        throw new Error('Failed to save subscription');
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setError('Failed to enable push notifications. Please try again.');
    }
  };

  const unsubscribeFromPushNotifications = async () => {
    if (!subscription?.endpoint) {
      setError('No active subscription found');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        // Get current subscription
        const currentSubscription = await registration.pushManager.getSubscription();
        if (currentSubscription) {
          await currentSubscription.unsubscribe();
        }
      }

      // Remove subscription from server
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userData?.user?.emailAddresses?.[0]?.emailAddress,
          endpoint: null,
          keys: {
            auth: null,
            p256dh: null
          }
        })
      });

      if (response.ok) {
        setSubscription(null);
        setSuccess('Push notifications disabled successfully');
      } else {
        throw new Error('Failed to remove subscription');
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setError('Failed to disable push notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const getPermissionStatusColor = () => {
    switch (permission) {
      case 'granted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'denied':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getPermissionStatusIcon = () => {
    switch (permission) {
      case 'granted':
        return <CheckCircle className="w-4 h-4" />;
      case 'denied':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Don't render if user is not available
  if (!userData?.user) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Permission Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Permission Status:</span>
            <Badge className={getPermissionStatusColor()}>
              <div className="flex items-center gap-1">
                {getPermissionStatusIcon()}
                {permission.charAt(0).toUpperCase() + permission.slice(1)}
              </div>
            </Badge>
          </div>

          {/* Subscription Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Subscription Status:</span>
            <Badge variant={subscription?.endpoint ? "default" : "secondary"}>
              {subscription?.endpoint ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {permission === 'granted' && subscription?.endpoint ? (
              <>
                <Button
                  onClick={unsubscribeFromPushNotifications}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <BellOff className="w-4 h-4" />
                  {loading ? 'Disabling...' : 'Disable Notifications'}
                </Button>
              </>
            ) : (
              <Button
                onClick={requestPermission}
                disabled={loading || permission === 'denied'}
                className="flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                {loading ? 'Enabling...' : 'Enable Notifications'}
              </Button>
            )}
          </div>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-50 border border-red-200 rounded-md"
              >
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-green-50 border border-green-200 rounded-md"
              >
                <p className="text-sm text-green-700">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help Text */}
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p>
              Enable push notifications to receive instant updates about:
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Payment verification results</li>
              <li>Match results and rewards</li>
              <li>Tournament announcements</li>
              <li>Account updates</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 