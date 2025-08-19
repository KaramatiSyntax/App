import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/subscription';
import { Notification } from '@/lib/models/notification';

/**
 * @description POST handler to create a notification and push it to every user.
 * This is an admin-level action.
 */
export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { title, body: messageBody, url } = body; // Renamed 'body' to avoid conflict

        if (!title || !messageBody) {
            return NextResponse.json({ success: false, error: "Title and body are required" }, { status: 400 });
        }

        // 1. Fetch all user IDs from the database
        const allUsers = await User.find({}).select('_id');
        if (allUsers.length === 0) {
            return NextResponse.json({ success: false, error: "No users found in the database" }, { status: 404 });
        }
        const userIds = allUsers.map(user => user._id);

        // 2. Define the new notification message object
        const newMessage = {
            title,
            body: messageBody,
            url: url || '/notifications', // Optional URL
            read: false,
            sentAt: new Date(),
        };

        // 3. Use `bulkWrite` for an efficient "upsert" operation
        // For each user, it finds their notification doc (or creates it) and pushes the new message.
        const bulkOps = userIds.map(userId => ({
            updateOne: {
                filter: { user: userId },
                update: {
                    $push: { messages: newMessage },
                    $setOnInsert: { user: userId } // Set user ID only when creating a new document
                },
                upsert: true // Creates the document if it doesn't exist
            }
        }));

        const result = await Notification.bulkWrite(bulkOps);

        const updatedCount = result.upsertedCount + result.modifiedCount;

        return NextResponse.json({
            success: true,
            message: `Successfully sent notification to ${updatedCount} users.`,
            details: result
        }, { status: 200 });

    } catch (error) {
        console.error("Error broadcasting notification:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
