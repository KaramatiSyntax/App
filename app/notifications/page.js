'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { useUserData } from "@/lib/hooks/useUserData";

export default function NotificationsPage() {
  const { userData, loading } = useUserData();
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date helper
  function formatDate(dateString) {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE, h:mm a');
    } else if (isThisMonth(date)) {
      return format(date, 'MMM d, h:mm a');
      } else {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  }

  // Group notifications by time period
  function groupNotificationsByTime(notifications) {
    const groups = {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      earlier: []
    };

    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      if (isToday(date)) {
        groups.today.push(notification);
      } else if (isYesterday(date)) {
        groups.yesterday.push(notification);
      } else if (isThisWeek(date)) {
        groups.lastWeek.push(notification);
      } else if (isThisMonth(date)) {
        groups.lastMonth.push(notification);
      } else {
        groups.earlier.push(notification);
      }
    });

    // Sort each group by date (newest first)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });

    return groups;
  }

  // Fetch user data and notifications
  useEffect(() => {
    async function fetchData() {
      try {
        setNotificationsLoading(true);
        setError(null);

        // Fetch user data (includes notifications)
        const userResponse = await fetch('/api/users/me');
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        const userData = await userResponse.json();

        if (userData.notifications && Array.isArray(userData.notifications)) {
          setNotifications(userData.notifications);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setNotificationsLoading(false);
      }
    }

    if (!loading) {
      fetchData();
    }
  }, [loading]);

  // Delete notification
  async function deleteNotification(notificationId) {
    try {
      const response = await fetch('/api/subscription/read', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userData.email,
          notificationId
        }),
      });

      if (response.ok) {
        // Remove from local state
        setNotifications(prev => 
          prev.filter(notification => notification._id !== notificationId)
        );
      } else {
        console.error('Failed to delete notification from database');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  // Loading state
  if (notificationsLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8 relative">
          <div className="max-w-4xl mx-auto">
    
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen relative">
        <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8 relative">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 text-white">{error}</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!userData) {
    return (
      <div className="min-h-screen relative">
        <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8 relative">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 text-white">Sign in to view your notifications</h2>
              <a href="/login" className="text-blue-500 underline">Sign In</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NotificationItem with swipe-to-delete
  function NotificationItem({ notification }) {
    let touchStartX = null;
    let touchEndX = null;
    const [dragX, setDragX] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };
    
    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchStartX !== null && touchEndX - touchStartX > 80) {
        handleDelete();
      }
      touchStartX = null;
      touchEndX = null;
    };

    const handleDelete = async () => {
      setIsDeleting(true);
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      await deleteNotification(notification._id);
    };

    return (
      <motion.div 
        className="relative mb-2"
        initial={{ opacity: 1, x: 0 }}
        animate={{ 
          opacity: isDeleting ? 0 : 1, 
          x: isDeleting ? -100 : 0,
          scale: isDeleting ? 0.95 : 1
        }}
        exit={{ opacity: 0, x: -100, scale: 0.95 }}
        transition={{ 
          duration: isDeleting ? 0.3 : 0.2,
          ease: "easeInOut"
        }}
      >
        {/* Delete background with gradient */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30"
          animate={{ 
            opacity: dragX > 20 ? Math.min(dragX / 100, 0.8) : 0,
            scale: dragX > 20 ? 1.02 : 1
          }}
          transition={{ duration: 0.1 }}
        />
        
        {/* Delete icon on left, visible when swiping right */}
        <motion.div
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
          animate={{ 
            opacity: dragX > 20 ? Math.min(dragX / 80, 1) : 0,
            scale: dragX > 20 ? 1.1 : 1,
            x: dragX > 20 ? Math.min(dragX / 10, 10) : 0
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <div className="w-8 h-8 rounded-full bg-red-500/90 flex items-center justify-center shadow-lg">
            <Trash2 className="w-4 h-4 text-white" />
          </div>
        </motion.div>

        <motion.div
          key={notification._id}
          className="p-2 sm:p-3 rounded-xl border border-white/10 shadow-md relative backdrop-blur bg-white/5 hover:bg-white/10 flex gap-2 items-start z-10 min-h-[48px] cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          drag="x"
          dragConstraints={{ left: 0, right: 120 }}
          dragElastic={0.3}
          dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
          onDrag={(event, info) => {
            setDragX(info.offset.x);
          }}
          onDragEnd={(event, info) => {
            if (info.offset.x > 80) {
              handleDelete();
            } else {
              setDragX(0);
            }
          }}
          whileDrag={{ 
            scale: 1.02,
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
          }}
          style={{
            transform: `translateX(${dragX}px)`,
            zIndex: dragX > 0 ? 20 : 10
          }}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-xs sm:text-sm text-white truncate">{notification.title}</h3>
            <p className="text-xs text-white/70 mt-0.5 truncate">{notification.body}</p>
            <p className="text-xs text-white/50 mt-0.5">{formatDate(notification.createdAt)}</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="min-h-screen relative">
        <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8 relative">
          <div className="max-w-4xl mx-auto">
            <div className="p-4 sm:p-10 rounded-2xl sm:rounded-3xl border border-white/20 bg-white/10 backdrop-blur-[12px] shadow-2xl">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <Bell className="w-8 h-8 text-white/50" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-white">No notifications yet</h2>
                <p className="text-white/70">You have no notifications at this time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const groupedNotifications = groupNotificationsByTime(notifications);

    return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8 relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
              <div className="relative">
            <Bell className="text-2xl sm:text-3xl text-blue-400 drop-shadow-lg" />
              </div>
          <h1 className="text-xl sm:text-3xl font-bold text-white">
                Notifications
              </h1>
        </div>

        {/* Notifications List by Time Period */}
        {groupedNotifications.today.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Today</h2>
            <div className="space-y-1">
              <AnimatePresence>
                {groupedNotifications.today.map((notification) => (
                  <NotificationItem key={notification._id} notification={notification} />
                ))}
              </AnimatePresence>
                </div>
                    </div>
                  )}
                  
        {groupedNotifications.yesterday.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Yesterday</h2>
            <div className="space-y-1">
              <AnimatePresence>
                {groupedNotifications.yesterday.map((notification) => (
                  <NotificationItem key={notification._id} notification={notification} />
                ))}
              </AnimatePresence>
            </div>
                    </div>
                  )}
                  
        {groupedNotifications.lastWeek.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Last Week</h2>
            <div className="space-y-1">
              <AnimatePresence>
                {groupedNotifications.lastWeek.map((notification) => (
                  <NotificationItem key={notification._id} notification={notification} />
                ))}
              </AnimatePresence>
            </div>
                </div>
              )}

        {groupedNotifications.lastMonth.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Last Month</h2>
            <div className="space-y-1">
              <AnimatePresence>
                {groupedNotifications.lastMonth.map((notification) => (
                  <NotificationItem key={notification._id} notification={notification} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {groupedNotifications.earlier.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Earlier</h2>
            <div className="space-y-1">
              <AnimatePresence>
                {groupedNotifications.earlier.map((notification) => (
                  <NotificationItem key={notification._id} notification={notification} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

