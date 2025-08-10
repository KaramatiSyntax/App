import { NextResponse } from "next/server";
import NotificationService from "@/lib/notificationService";

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, userEmail, ...data } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'userEmail is required' },
        { status: 400 }
      );
    }

    let success = false;

    switch (type) {
      case 'paymentVerified':
        success = await NotificationService.notifyPaymentVerified(
          userEmail, 
          data.amount, 
          data.transactionId
        );
        break;

      case 'paymentRejected':
        success = await NotificationService.notifyPaymentRejected(
          userEmail, 
          data.amount, 
          data.reason
        );
        break;

      case 'withdrawalApproved':
        success = await NotificationService.notifyWithdrawalApproved(
          userEmail, 
          data.amount, 
          data.upiId
        );
        break;

      case 'withdrawalRejected':
        success = await NotificationService.notifyWithdrawalRejected(
          userEmail, 
          data.amount, 
          data.reason
        );
        break;

      case 'withdrawalCompleted':
        success = await NotificationService.notifyWithdrawalCompleted(
          userEmail, 
          data.amount, 
          data.transactionId
        );
        break;

      case 'eventRegistration':
        success = await NotificationService.notifyEventRegistration(
          userEmail, 
          data.eventName
        );
        break;

      case 'eventReminder':
        success = await NotificationService.notifyEventReminder(
          userEmail, 
          data.eventName, 
          data.time
        );
        break;

      case 'matchResult':
        success = await NotificationService.notifyMatchResult(
          userEmail, 
          data.matchResult, 
          data.eventName
        );
        break;

      case 'welcome':
        success = await NotificationService.notifyWelcome(userEmail);
        break;

      case 'maintenance':
        success = await NotificationService.notifyMaintenance(
          userEmail, 
          data.message
        );
        break;

      case 'custom':
        success = await NotificationService.sendCustomNotification(
          userEmail,
          data.title,
          data.message
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({ message: 'Notification sent successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
} 