import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/subscription';
import { Notification } from '@/lib/models/notifications';

/**
 * @description GET handler to fetch all notifications for a specific user.
 */
export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const userEmail = searchParams.get('userEmail');

        if (!userEmail) {
            return NextResponse.json({ success: false, error: "User email is required" }, { status: 400 });
        }

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        const notificationDoc = await Notification.findOne({ user: user._id });
        if (!notificationDoc) {
            // New user case: return an empty array with a success status
            return NextResponse.json({ success: true, notifications: [] }, { status: 200 });
        }

        // Return a cleaner object with the notifications array
        return NextResponse.json({ success: true, notifications: notificationDoc.notifications }, { status: 200 });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

/**
 * @description DELETE handler to remove a single message from a user's notification array.
 */
export async function DELETE(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { userEmail, messageId } = body;

        if (!userEmail || !messageId) {
            return NextResponse.json({ success: false, error: "userEmail and messageId are required" }, { status: 400 });
        }

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // Use MongoDB's $pull operator to remove the specific notification from the array
        const result = await Notification.updateOne(
            { user: user._id },
            { $pull: { notifications: { _id: messageId } } }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json({ success: false, error: "Notification message not found or already deleted" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Notification deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error deleting notification:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}