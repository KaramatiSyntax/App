import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TransitionLog from '@/lib/models/transitionLog';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { screenshotHash, userEmail } = body;

    if (!screenshotHash) {
      return NextResponse.json(
        { error: 'Screenshot hash is required' },
        { status: 400 }
      );
    }

    // Check if screenshot hash already exists (only verified ones)
    const existingScreenshot = await TransitionLog.findOne({ 
      screenshotHash,
      status: 'verified'
    });
    
    if (existingScreenshot) {
      return NextResponse.json({
        isDuplicate: true,
        existingTransition: {
          transitionId: existingScreenshot.transitionId,
          userEmail: existingScreenshot.userEmail,
          amount: existingScreenshot.amount,
          status: existingScreenshot.status,
          createdAt: existingScreenshot.createdAt
        }
      });
    }

    return NextResponse.json({
      isDuplicate: false
    });

  } catch (error) {
    console.error('Error checking screenshot duplicate:', error);
    return NextResponse.json(
      { error: 'Failed to check screenshot duplicate' },
      { status: 500 }
    );
  }
} 