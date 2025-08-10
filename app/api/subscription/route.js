import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Subscription from "@/lib/models/subscription";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userEmail = searchParams.get('userEmail');

        if (!userEmail) {
            return NextResponse.json(
                { error: "User email is required" },
                { status: 400 }
            );
        }

        await dbConnect();
        console.log("Fetching subscription for:", userEmail);
        const subscription = await Subscription.findOne({ userEmail });
        console.log("Subscription found:", !!subscription);
        if (subscription) {
            console.log("Notification count:", subscription.notifications?.length || 0);
        }

        if (!subscription) {
            // Return empty subscription instead of 404
            console.log("No subscription found, returning empty subscription");
            return NextResponse.json({
                userEmail,
                notifications: [],
                endpoint: null,
                keys: {
                    auth: null,
                    p256dh: null
                }
            });
        }

        return NextResponse.json(subscription);
    } catch (error) {
        console.error("Error fetching subscription:", error);
        return NextResponse.json(
            { error: "Failed to fetch subscription" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { userEmail, endpoint, keys } = body;

        if (!userEmail || !endpoint || !keys) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if subscription already exists
        let subscription = await Subscription.findOne({ userEmail });

        if (subscription) {
            // Update existing subscription
            subscription.endpoint = endpoint;
            subscription.keys = keys;
        } else {
            // Create new subscription
            subscription = new Subscription({
                userEmail,
                endpoint,
                keys,
                notifications: []
            });
        }

        await subscription.save();

        return NextResponse.json({ 
            message: 'Subscription saved successfully',
            subscription 
        });
    } catch (error) {
        console.error('Error saving subscription:', error);
        return NextResponse.json(
            { error: 'Failed to save subscription' },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const data = await request.json();
        const { userEmail, notificationId, markAllAsRead, notifications } = data;

        await dbConnect();

        // If id is provided, update by subscription ID
        if (id) {
            const subscription = await Subscription.findByIdAndUpdate(
                id,
                { notifications },
                { new: true, runValidators: true }
            );

            if (!subscription) {
                return NextResponse.json(
                    { error: "Subscription not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json(subscription);
        }

        // Otherwise, update by userEmail
        if (!userEmail) {
            return NextResponse.json(
                { error: "User email is required" },
                { status: 400 }
            );
        }

        let updateOperation = {};
        let arrayFilters = [];

        if (markAllAsRead) {
            updateOperation = {
                $set: {
                    'notifications.$[].read': true
                }
            };
        } else if (notificationId) {
            updateOperation = {
                $set: {
                    'notifications.$[elem].read': true
                }
            };
            arrayFilters = [
                { 'elem._id': new mongoose.Types.ObjectId(notificationId) }
            ];
        } else {
            return NextResponse.json(
                { error: "Either notificationId or markAllAsRead must be provided" },
                { status: 400 }
            );
        }

        const subscription = await Subscription.findOneAndUpdate(
            { userEmail },
            updateOperation,
            {
                new: true,
                runValidators: true,
                arrayFilters
            }
        );

        if (!subscription) {
            return NextResponse.json(
                { error: "Subscription not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(subscription);
    } catch (error) {
        console.error("Error updating subscription:", error);
        return NextResponse.json(
            { error: "Failed to update subscription" },
            { status: 500 }
        );
    }
}
