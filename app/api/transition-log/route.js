import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TransitionLog from '@/lib/models/transitionLog';
import crypto from 'crypto';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { transitionId, userEmail, amount, screenshotHash } = body;

    if (!transitionId || !userEmail || !amount || !screenshotHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if transition ID already exists
    const existingTransition = await TransitionLog.findOne({ transitionId });
    if (existingTransition) {
      return NextResponse.json(
        { error: 'Transition ID already exists' },
        { status: 409 }
      );
    }

    // Check if screenshot hash already exists (only verified ones)
    const existingScreenshot = await TransitionLog.findOne({ 
      screenshotHash,
      status: 'verified'
    });
    
    if (existingScreenshot) {
      return NextResponse.json(
        { 
          error: 'Screenshot already used',
          isDuplicate: true,
          existingTransition: existingScreenshot
        },
        { status: 409 }
      );
    }

    // Create new transition log
    const transitionLog = await TransitionLog.create({
      transitionId,
      userEmail,
      amount,
      screenshotHash,
      status: 'pending'
    });

    return NextResponse.json({
      success: true,
      transitionLog
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating transition log:', error);
    return NextResponse.json(
      { error: 'Failed to create transition log' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const transitionId = searchParams.get('transitionId');

    let query = {};
    
    if (userEmail) {
      query.userEmail = userEmail;
    }
    
    if (transitionId) {
      query.transitionId = transitionId;
    }

    const transitionLogs = await TransitionLog.find(query)
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      transitionLogs
    });

  } catch (error) {
    console.error('Error fetching transition logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transition logs' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const { status, adminNotes, paymentId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Transition log ID is required' },
        { status: 400 }
      );
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (paymentId) updateData.paymentId = paymentId;
    
    if (status === 'verified') {
      updateData.verifiedAt = new Date();
    }

    const transitionLog = await TransitionLog.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!transitionLog) {
      return NextResponse.json(
        { error: 'Transition log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transitionLog
    });

  } catch (error) {
    console.error('Error updating transition log:', error);
    return NextResponse.json(
      { error: 'Failed to update transition log' },
      { status: 500 }
    );
  }
} 