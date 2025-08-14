import dbConnect from './dbConnect';
import Subscription from './models/subscription';
import webpush from 'web-push';

export class NotificationService {
  static async sendNotification(userEmail, title, body, image = null) {
    try {
      
      if (!userEmail || !title || !body) {
        console.error('Missing required fields:', { userEmail, title, body });
        return false;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        console.error(`Invalid email format: ${userEmail}`);
        return false;
      }

      // Test database connection
      try {
        await dbConnect();
      } catch (dbError) {
        console.error(`Database connection failed for ${userEmail}:`, dbError);
        return false;
      }

      // Create notification object
      const notification = {
        title,
        body,
        image,
        createdAt: new Date(),
        read: false
      };

      
      try {
        // Use findOneAndUpdate to avoid version conflicts and handle subscription creation
        const updatedSubscription = await Subscription.findOneAndUpdate(
          { userEmail },
          { 
            $push: { notifications: notification },
            $setOnInsert: {
              endpoint: null,
              keys: {
                auth: null,
                p256dh: null
              }
            }
          },
          { 
            new: true, 
            upsert: true,
            setDefaultsOnInsert: true
          }
        );
        
        
        if (updatedSubscription) {
        } else {
          console.error(`Failed to update subscription for: ${userEmail}`);
          return false;
        }

        // Send push notification if endpoint exists
        if (updatedSubscription.endpoint && updatedSubscription.keys && updatedSubscription.keys.auth && updatedSubscription.keys.p256dh) {
          await this.sendPushNotification(updatedSubscription, notification);
        } else {
        }

        return true;
      } catch (saveError) {
        console.error(`Error saving notification for ${userEmail}:`, saveError);
        console.error('Save error details:', saveError.message, saveError.stack);
        return false;
      }
    } catch (error) {
      console.error(`Error sending notification to ${userEmail}:`, error);
      console.error('Full error details:', error.message, error.stack);
      return false;
    }
  }

  static async sendPushNotification(subscription, notification) {
    try {
      // Configure web-push with VAPID keys
      const vapidKeys = {
        publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY,
      };

      if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
        console.warn('VAPID keys not configured. Push notifications will not work.');
        return false;
      }

      webpush.setVapidDetails(
        'mailto:your-email@example.com', // Replace with your email
        vapidKeys.publicKey,
        vapidKeys.privateKey
      );

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
              icon: notification.image || '/logo.png',
      badge: '/logo.png',
        image: notification.image || null, // Add image for rich notifications
        tag: 'custom-notification',
        data: {
          url: '/notifications',
          timestamp: notification.createdAt.toISOString()
        },
        actions: [
          {
            action: 'view',
            title: 'View',
            icon: '/logo.png'
          },
          {
            action: 'close',
            title: 'Close',
            icon: '/logo.png'
          }
        ]
      });

      await webpush.sendNotification(subscription, payload);
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Payment verification notifications
  static async notifyPaymentVerified(userEmail, amount, transactionId) {
    return await this.sendNotification(
      userEmail,
      'Payment Verified! 💰',
      `Your payment of ₹${amount} has been verified. ${amount} coins have been added to your wallet.`,
      '/logo.png'
    );
  }

  static async notifyPaymentRejected(userEmail, amount, reason) {
    return await this.sendNotification(
      userEmail,
      'Payment Rejected ❌',
      `Your payment of ₹${amount} was rejected. Reason: ${reason}`,
      '/logo.png'
    );
  }

  // Withdrawal notifications
  static async notifyWithdrawalApproved(userEmail, amount, upiId) {
    return await this.sendNotification(
      userEmail,
      'Withdrawal Approved! ✅',
      `Your withdrawal request of ₹${amount} has been sent to ${upiId} `,
      '/logo.png'
    );
  }

  static async notifyWithdrawalRejected(userEmail, amount, reason) {
    return await this.sendNotification(
      userEmail,
      'Withdrawal Rejected ❌',
      `Your withdrawal request of ₹${amount} was rejected and amount had refunded to your account. Reason: ${reason}`,
      '/logo.png'
    );
  }

  static async notifyWithdrawalCompleted(userEmail, amount, transactionId) {
    return await this.sendNotification(
      userEmail,
      'Withdrawal Completed! 💸',
      `Your withdrawal of ₹${amount} has been completed. Transaction ID: ${transactionId}`,
      '/logo.png'
    );
  }

  // Event notifications
  static async notifyEventRegistration(userEmail, eventName) {
    return await this.sendNotification(
      userEmail,
      'Event Registration Successful! 🎮',
      `You have successfully registered for "${eventName}". Check your email for event details.`,
      '/logo.png'
    );
  }

  static async notifyEventReminder(userEmail, eventName, time) {
    return await this.sendNotification(
      userEmail,
      'Event Reminder! ⏰',
      `Your event "${eventName}" starts in ${time}. Get ready to play!`,
      '/logo.png'
    );
  }

  // Match notifications
  static async notifyMatchResult(userEmail, matchResult, eventName) {
    const title = matchResult === 'won' ? 'Victory! 🏆' : 'Match Result 📊';
    const body = matchResult === 'won' 
      ? `Congratulations! You won the match in "${eventName}"!`
      : `Match completed in "${eventName}". Check your results.`;
    
    return await this.sendNotification(userEmail, title, body, '/logo.png');
  }

  // General notifications
  static async notifyWelcome(userEmail) {
    return await this.sendNotification(
      userEmail,
      'Welcome to TurraniX! 🎮',
      'Thank you for joining our gaming community. Start exploring events and tournaments!',
      '/logo.png'
    );
  }

  static async notifyMaintenance(userEmail, message) {
    return await this.sendNotification(
      userEmail,
      'System Maintenance 🔧',
      message,
      '/logo.png'
    );
  }

  // Custom notification from admin
  static async sendCustomNotification(userEmail, title, message) {
    return await this.sendNotification(
      userEmail,
      title,
      message,
      '/logo.png'
    );
  }

  // Points update notification
  static async notifyPointsUpdated(userEmail, matchName, points, updatedBy) {
    return await this.sendNotification(
      userEmail,
      'Points Updated! 🎯',
      `Your points in "${matchName}" have been updated to ${points} by ${updatedBy}.`,
      '/logo.png'
    );
  }

  // Points added notification
  static async notifyPointsAdded(userEmail, matchName, pointsAdded, totalPoints, updatedBy) {
    return await this.sendNotification(
      userEmail,
      'Points Added! 🎯',
      `${pointsAdded} coins added to your wallet for match "${matchName}". Total points: ${totalPoints}`,
      '/logo.png'
    );
  }

  // Points deducted notification
  static async notifyPointsDeducted(userEmail, matchName, pointsDeducted, totalPoints, updatedBy) {
    return await this.sendNotification(
      userEmail,
      'Points Deducted! ⚠️',
      `${pointsDeducted} coins deducted from your wallet for match "${matchName}". Total points: ${totalPoints}`,
      '/logo.png'
    );
  }
}

export default NotificationService; 