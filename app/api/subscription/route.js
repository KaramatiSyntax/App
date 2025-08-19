import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { NotificationSubscription, User } from '@/lib/models/subscription'; 

/**
 * @description Saves a push notification subscription for a user.
 * It finds the user by email, then checks if a subscription for the given
 * endpoint already exists to avoid duplicates. If not, it creates a new one.
 * This correctly handles a user having multiple subscriptions on different devices.
 */
export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { userEmail, subscriptionObject } = body;

        // 1. Validate the incoming data from the frontend
        if (!userEmail || !subscriptionObject || !subscriptionObject.endpoint || !subscriptionObject.keys) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: userEmail and subscriptionObject.' },
                { status: 400 }
            );
        }

        // 2. Find the user by their email to get their unique _id
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found.' },
                { status: 404 }
            );
        }

        // 3. Check if a subscription with this exact endpoint already exists.
        // This prevents creating duplicate subscriptions for the same device/browser.
        const existingSubscription = await NotificationSubscription.findOne({
            endpoint: subscriptionObject.endpoint,
        });

        if (existingSubscription) {
            // The subscription already exists. We can just send a success response.
            return NextResponse.json({
                success: true,
                message: 'This device is already subscribed.',
                subscription: existingSubscription,
            }, { status: 200 });
        }

        // 4. If it's a new subscription, create and save it.
        const newSubscription = new NotificationSubscription({
            user: user._id, // Link to the user's permanent ObjectId
            endpoint: subscriptionObject.endpoint,
            keys: {
                p256dh: subscriptionObject.keys.p256dh,
                auth: subscriptionObject.keys.auth,
            },
        });

        await newSubscription.save();

        // Use status 201 Created for a new resource.
        return NextResponse.json({
            success: true,
            message: 'Subscription saved successfully.',
            subscription: newSubscription,
        }, { status: 201 });

    } catch (error) {
        console.error('Error saving subscription:', error);
        // Provide a generic error message to the client
        return NextResponse.json(
            { success: false, error: 'An internal server error occurred.' },
            { status: 500 }
        );
    }
}
