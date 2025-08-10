import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Subscription from "@/lib/models/subscription";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const subscription = await Subscription.findOne({ userEmail });

    if (!subscription) {
      return NextResponse.json({ notifications: [], total: 0 });
    }

    // Sort notifications by creation date (newest first)
    const sortedNotifications = subscription.notifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Paginate
    const paginatedNotifications = sortedNotifications.slice(skip, skip + limit);

    return NextResponse.json({
      notifications: paginatedNotifications,
      total: sortedNotifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { userEmail, notificationId } = body;

    if (!userEmail || !notificationId) {
      return NextResponse.json(
        { error: 'User email and notification ID are required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const subscription = await Subscription.findOne({ userEmail });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Mark notification as read
    const notification = subscription.notifications.id(notificationId);
    if (notification) {
      notification.read = true;
      await subscription.save();
    }

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { userEmail, notificationId } = body;

    if (!userEmail || !notificationId) {
      return NextResponse.json(
        { error: 'User email and notification ID are required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const subscription = await Subscription.findOne({ userEmail });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Remove the notification from the array
    subscription.notifications = subscription.notifications.filter(
      notification => notification._id.toString() !== notificationId
    );

    await subscription.save();

    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
} 