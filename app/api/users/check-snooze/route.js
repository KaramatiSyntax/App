import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/users';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { userEmail } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if snooze has expired
    if (user.isSnoozed && user.snoozeExpiry && new Date() > user.snoozeExpiry) {
      // Clear the snooze
      user.isSnoozed = false;
      user.snoozeReason = null;
      user.snoozeExpiry = null;
      user.retryCount = 0;
      await user.save();

      return NextResponse.json({
        success: true,
        isSnoozed: false,
        message: 'Snooze has been cleared'
      });
    }

    return NextResponse.json({
      success: true,
      isSnoozed: user.isSnoozed,
      snoozeReason: user.snoozeReason,
      snoozeExpiry: user.snoozeExpiry,
      retryCount: user.retryCount,
      canRetry: user.snoozeExpiry ? new Date() > user.snoozeExpiry : false
    });

  } catch (error) {
    console.error('Error checking snooze:', error);
    return NextResponse.json(
      { error: 'Failed to check snooze status' },
      { status: 500 }
    );
  }
} 