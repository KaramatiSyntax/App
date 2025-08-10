import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TransitionLog from '@/lib/models/transitionLog';
import User from '@/lib/models/users';
import NotificationService from '@/lib/notificationService';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { transitionId, action, adminNotes, coins } = body;

    if (!transitionId || !action) {
      return NextResponse.json(
        { error: 'Transition ID and action are required' },
        { status: 400 }
      );
    }

    // Find the transition log
    const transitionLog = await TransitionLog.findOne({ transitionId });
    if (!transitionLog) {
      return NextResponse.json(
        { error: 'Transition log not found' },
        { status: 404 }
      );
    }

    // Find the user
    const user = await User.findOne({ email: transitionLog.userEmail });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let notificationTitle = '';
    let notificationMessage = '';
    let shouldDeductCoins = false;

    // Prevent duplicate actions
    if ((action === 'accept' && transitionLog.status === 'verified') || (action === 'reject' && transitionLog.status === 'rejected')) {
      return NextResponse.json(
        { error: `This transaction has already been ${transitionLog.status} by ${transitionLog.actionBy || 'unknown'}` },
        { status: 400 }
      );
    }

    switch (action) {
      case 'accept':
        transitionLog.status = 'verified';
        transitionLog.verifiedAt = new Date();
        transitionLog.adminNotes = adminNotes;
        transitionLog.actionBy = 'admin';
        // Remove notification sending for verified/coin added
        break;

      case 'admin_accepted':
        transitionLog.status = 'admin_accepted';
        await transitionLog.save();
        return NextResponse.json({ success: true, transitionLog });

      case 'done':
        transitionLog.status = 'done';
        await transitionLog.save();
        return NextResponse.json({ success: true, transitionLog });

      case 'reject':
        // If previously verified/admin_accepted, deduct coins
        if (transitionLog.status === 'verified' || transitionLog.status === 'admin_accepted') {
          const currentCoins = user.coins || 0;
          const deductAmount = transitionLog.amount || 0;
          user.coins = Math.max(0, currentCoins - deductAmount);
          await user.save();
        }
        transitionLog.status = 'rejected';
        transitionLog.adminNotes = adminNotes;
        transitionLog.actionBy = 'admin';
        notificationTitle = 'Payment Rejected ❌';
        notificationMessage = `Your payment of ₹${transitionLog.amount} has been rejected.`;
        if (adminNotes) {
          notificationMessage += `\n\nReason: ${adminNotes}`;
        }
        break;

      case 'snooze': // This is the admin snooze
        user.isSnoozed = true;
        user.snoozeReason = adminNotes || 'Account snoozed by admin';
        user.snoozeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await user.save();
        // Mark all transition logs for this user as snoozed
        await TransitionLog.updateMany(
          { userEmail: user.email },
          {
            isSnoozed: true,
            snoozeReason: user.snoozeReason,
            snoozeExpiry: user.snoozeExpiry
          }
        );
        notificationTitle = 'Account Snoozed ⏸️';
        notificationMessage = `Your account has been snoozed for 24 hours. You cannot add coins or redeem during this period.\n\nReason: ${user.snoozeReason}`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use accept, reject, or snooze' },
          { status: 400 }
        );
    }

    // Deduct coins if needed
    if (shouldDeductCoins) {
      const currentCoins = user.coins || 0;
      const newCoins = Math.max(0, currentCoins - transitionLog.amount);
      user.coins = newCoins;
      await user.save();
    }

    // Save the transition log
    await transitionLog.save();

    // Send notification
    try {
      // Only send notification for rejections or errors if needed
      if (notificationTitle && notificationMessage) {
        await NotificationService.sendCustomNotification(
          transitionLog.userEmail,
          notificationTitle,
          notificationMessage
        );
      }
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      transitionLog,
      user: {
        email: user.email,
        coins: user.coins,
        isSnoozed: user.isSnoozed
      }
    });

  } catch (error) {
    console.error('Error processing transition log action:', error);
    return NextResponse.json(
      { error: `Failed to process action: ${error.message}` },
      { status: 500 }
    );
  }
} 