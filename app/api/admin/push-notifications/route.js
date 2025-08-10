import { NextResponse } from "next/server";
import NotificationService from "@/lib/notificationService";
import dbConnect from "@/lib/dbConnect";
import Subscription from "@/lib/models/subscription";

export async function POST(request) {
  try {
    const body = await request.json();
    const { userEmails, title, message, type = "custom" } = body;

    console.log('Admin push notification request:', { userEmails, title, message, type });

    if (!userEmails || !Array.isArray(userEmails) || userEmails.length === 0) {
      return NextResponse.json(
        { error: 'userEmails array is required' },
        { status: 400 }
      );
    }

    if (!title || !message) {
      return NextResponse.json(
        { error: 'title and message are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const userEmail of userEmails) {
      try {
        // Send notification using NotificationService
        const success = await NotificationService.sendCustomNotification(
          userEmail,
          title,
          message
        );

        if (success) {
          successCount++;
          results.push({ email: userEmail, success: true });
        } else {
          failureCount++;
          results.push({ email: userEmail, success: false, error: 'Failed to send notification' });
        }
      } catch (error) {
        console.error(`Error sending notification to ${userEmail}:`, error);
        failureCount++;
        results.push({ email: userEmail, success: false, error: error.message });
      }
    }

    console.log(`Admin notification results: ${successCount} successful, ${failureCount} failed`);

    return NextResponse.json({
      message: `Notifications sent: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: userEmails.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('Error in admin push notifications API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
} 