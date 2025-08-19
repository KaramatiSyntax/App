'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Bell, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { useUserData } from "@/lib/hooks/useUserData";

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    if (!base64String) return new Uint8Array(0);
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Subscription Manager Component
function SubscriptionManager({ userEmail }) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscriptionLoading, setSubscriptionLoading] = useState(true);
    const [permissionStatus, setPermissionStatus] = useState('default');
    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setPermissionStatus('unsupported');
            setSubscriptionLoading(false);
            return;
        }
        const checkSubscription = async () => {
            try {
                setPermissionStatus(Notification.permission);
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            } catch (e) {
                console.error("Error checking subscription:", e);
            } finally {
                setSubscriptionLoading(false);
            }
        };
        checkSubscription();
    }, []);

    const handleSubscribe = async () => {
        if (!userEmail || !VAPID_PUBLIC_KEY) {
            alert('User data is not available or VAPID key is missing.');
            return;
        }
        setSubscriptionLoading(true);
        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);
            if (permission !== 'granted') {
                setSubscriptionLoading(false);
                return;
            }
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            await fetch('/api/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail, subscriptionObject: subscription }),
            });
            setIsSubscribed(true);
        } catch (error) {
            console.error('Error subscribing:', error);
        } finally {
            setSubscriptionLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        setSubscriptionLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }
            setIsSubscribed(false);
        } catch (error) {
            console.error('Error unsubscribing:', error);
        } finally {
            setSubscriptionLoading(false);
        }
    };

    if (permissionStatus === 'unsupported') return null;

    return (
        <div className="p-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm mb-6 flex items-center justify-between">
            <div>
                <h3 className="font-bold text-white">Notification Settings</h3>
                <p className="text-sm text-white/70">
                    {isSubscribed ? "You are subscribed to notifications on this device." : "Enable notifications for updates."}
                </p>
                {permissionStatus === 'denied' && <p className="text-xs text-red-400 mt-1">You have blocked notifications. Please enable them in your browser settings.</p>}
            </div>
            <button
                onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                disabled={subscriptionLoading || permissionStatus === 'denied'}
                className={`px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 ${isSubscribed ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {subscriptionLoading ? '...' : (isSubscribed ? 'Disable' : 'Enable')}
            </button>
        </div>
    );
}

// Notification Item Component
function NotificationItem({ notification, deleteNotification, formatDate }) {
    const handleDelete = () => {
        if (navigator.vibrate) navigator.vibrate(50);
        deleteNotification(notification._id);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative"
        >
            <div className="p-2 sm:p-3 rounded-xl border border-white/10 shadow-md backdrop-blur bg-white/5 hover:bg-white/10 flex gap-2 items-start z-10">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bell className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xs sm:text-sm text-white">{notification.title}</h3>
                    <p className="text-xs text-white/70 mt-0.5">{notification.body}</p>
                    {/* --- CORRECTED LINE BELOW: from .sentAt to .createdAt --- */}
                    <p className="text-xs text-white/50 mt-1">{formatDate(notification.createdAt)}</p>
                </div>
                <button onClick={handleDelete} className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                    <Trash2 className="w-3 h-3"/>
                </button>
            </div>
        </motion.div>
    );
}


// Main Page Component
export default function NotificationsPage() {
    const { userData, loading: userLoading } = useUserData();
    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchNotifications() {
            if (userLoading) {
                return;
            }

            if (!userData?.email) {
                setError("Could not load user data.");
                setNotificationsLoading(false);
                return;
            }

            setNotificationsLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/notifications?userEmail=${userData.email}`);
                
                if (response.status === 404) {
                    setNotifications([]);
                } else if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch notifications');
                } else {
                    const data = await response.json();
                    setNotifications(data?.notifications || []);
                }

            } catch (err) {
                console.error('Error fetching notifications:', err);
                setError(err.message);
            } finally {
                setNotificationsLoading(false);
            }
        }

        fetchNotifications();
    }, [userLoading, userData]);

    async function deleteNotification(messageId) {
        try {
            const response = await fetch('/api/notifications', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: userData.email, messageId }),
            });
            if (response.ok) {
                setNotifications(prev => prev.filter(msg => msg._id !== messageId));
            } else {
                console.error('Failed to delete notification from database');
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
        if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`;
        if (isThisWeek(date)) return format(date, 'EEEE, h:mm a');
        if (isThisMonth(date)) return format(date, 'MMM d, h:mm a');
        return format(date, 'MMM d, yyyy h:mm a');
    }

    function groupNotificationsByTime(messages) {
        const groups = { today: [], yesterday: [], lastWeek: [], lastMonth: [], earlier: [] };
        messages.forEach(msg => {
            // --- CORRECTED LINE: from .sentAt to .createdAt ---
            const date = new Date(msg.createdAt);
            if (isToday(date)) groups.today.push(msg);
            else if (isYesterday(date)) groups.yesterday.push(msg);
            else if (isThisWeek(date)) groups.lastWeek.push(msg);
            else if (isThisMonth(date)) groups.lastMonth.push(msg);
            else groups.earlier.push(msg);
        });
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        });
        return groups;
    }

    if (notificationsLoading || userLoading) {
        return <div className="text-center p-10 text-white">Loading...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-400">Error: {error}</div>;
    }

    const groupedNotifications = groupNotificationsByTime(notifications);

    return (
        <div className="min-h-screen relative">
            <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8 relative">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <Bell className="text-2xl sm:text-3xl text-blue-400 drop-shadow-lg" />
                        <h1 className="text-xl sm:text-3xl font-bold text-white">Notifications</h1>
                    </div>
                    <SubscriptionManager userEmail={userData?.email} />
                    
                    {notifications.length === 0 ? (
                        <div className="p-4 sm:p-10 rounded-2xl sm:rounded-3xl border border-white/20 bg-white/10 backdrop-blur-[12px] shadow-2xl">
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                                    <Bell className="w-8 h-8 text-white/50" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2 text-white">No notifications yet</h2>
                                <p className="text-white/70">You have no notifications at this time.</p>
                            </div>
                        </div>
                    ) : (
                        Object.entries(groupedNotifications).map(([groupName, groupNotifications]) => (
                            groupNotifications.length > 0 && (
                                <div key={groupName} className="mb-6">
                                    <h2 className="text-lg font-semibold text-white mb-3 capitalize">{groupName.replace('last', 'Last ')}</h2>
                                    <div className="space-y-1">
                                        <AnimatePresence>
                                            {groupNotifications.map((notification) => (
                                                <NotificationItem key={notification._id} notification={notification} deleteNotification={deleteNotification} formatDate={formatDate} />
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}