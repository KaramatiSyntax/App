import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/users';
import TransitionLog from '@/lib/models/transitionLog';
import { rateLimiter } from '@/lib/rateLimiter';
import { GoogleGenAI } from '@google/genai';
import ExifReader from 'exifreader';
import crypto from 'crypto';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const UPI_ID = "turraniesports@ybl";
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1000;

export async function POST(req) {
  try {
    await dbConnect();
    const formData = await req.formData();
    
    // Debug: Log all form data entries
    console.log("API - Form data entries:");
    for (let [key, value] of formData.entries()) {
      console.log(key, typeof value, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
    }
    
    const userEmail = formData.get('userEmail');
    const screenshot = formData.get('screenshot');
    
    // Debug: Log extracted values
    console.log("API - Extracted values:", {
      userEmail: userEmail,
      screenshot: screenshot ? `File: ${screenshot.name} (${screenshot.size} bytes)` : null,
      hasUserEmail: !!userEmail,
      hasScreenshot: !!screenshot
    });
    
    if (!userEmail || !screenshot) {
      console.log("API - Missing required fields:", { userEmail: !!userEmail, screenshot: !!screenshot });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Rate limit, duplicate, and snooze checks (as in your current setup)
    // Rate limiting
    const rateLimitCheck = rateLimiter.isRateLimited(userEmail, 'payment', 5, 60 * 1000);
    if (rateLimitCheck.limited) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        remainingTime: Math.ceil(rateLimitCheck.remainingTime / 1000),
        attempts: rateLimitCheck.attempts
      }, { status: 429 });
    }

    // User check
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.isSnoozed) {
      return NextResponse.json({
        error: 'Account is snoozed',
        snoozeReason: user.snoozeReason,
        snoozeExpiry: user.snoozeExpiry
      }, { status: 403 });
    }

    // Convert image to base64
    const imageBuffer = Buffer.from(await screenshot.arrayBuffer());
    const base64Image = imageBuffer.toString('base64');

    // Improved duplicate check (SHA256 hash)
    const screenshotHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
    const duplicateStatuses = ['verified', 'admin_accepted', 'done', 'pending'];
    const existingTransition = await TransitionLog.findOne({
      screenshotHash,
      status: { $in: duplicateStatuses }
    });
    if (existingTransition) {
      // Increment duplicateCount for analytics
      await TransitionLog.updateOne(
        { _id: existingTransition._id },
        { $inc: { duplicateCount: 1 } }
      );
      return NextResponse.json({ error: 'Duplicate screenshot detected. This payment screenshot has already been used.' }, { status: 400 });
    }

    // Gemini Vision prompt
    const prompt = `You are a strict UPI payment screenshot verifier. Extract the following from the uploaded screenshot:\n\n1. UPI ID of receiver (e.g. turraniesports@ybl)\n2. Amount paid (e.g. ₹50)\n3. Transaction status (Success/Failure)\n4. App used (PhonePe, Google Pay, Paytm)\n5. Date and time of transaction (if available)\n\nMake sure to detect **only real screenshots** from official UPI apps.\n\nReply in this strict JSON format:\n\n{\n  \"upi_id\": \"\",\n  \"amount\": \"\",\n  \"success\": true,\n  \"app\": \"\",\n  \"date\": \"\"\n}`;

    // Call Gemini Vision
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: screenshot.type, data: base64Image } }
          ]
        }
      ]
    });

    // Log Gemini response for debugging
    console.log('Gemini raw response:', res.text);

    // Parse Gemini response
    let result;
    try {
      const jsonMatch = res.text?.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      // Log the raw response for debugging
      console.log('Gemini JSON parse error:', e);
      console.log('Gemini raw response (parse error):', res.text);
      // Instead of treating as a hard failure, return a user-friendly error
      return NextResponse.json({ error: 'Could not read payment details from screenshot. Please try a clearer screenshot or different UPI app.' }, { status: 400 });
    }

    // Log parsed result
    console.log('Gemini parsed result:', result);

    // Extract possible transaction/reference ID from Gemini result
    const transactionId = result?.transaction_id || result?.reference || result?.ref || null;
    if (transactionId) {
      // Check for duplicate transaction ID
      const duplicateStatuses = ['verified', 'admin_accepted', 'done', 'pending'];
      const existingTxn = await TransitionLog.findOne({
        transactionId,
        status: { $in: duplicateStatuses }
      });
      if (existingTxn) {
        await TransitionLog.updateOne(
          { _id: existingTxn._id },
          { $inc: { duplicateCount: 1 } }
        );
        return NextResponse.json({ error: 'Duplicate UPI transaction detected. This payment has already been used.' }, { status: 400 });
      }
    }

    // Always parse and validate amount
    // Remove currency symbols and non-numeric characters from amount string
    const amountStr = (result?.amount || '').replace(/[^0-9.]/g, '');
    const parsedAmount = Number(amountStr);
    const safeAmount = isNaN(parsedAmount) ? 0 : parsedAmount;

    // Log validation checks
    console.log('Validation checks:', {
      upi_id: result?.upi_id,
      upi_id_match: result?.upi_id?.toLowerCase() === UPI_ID.toLowerCase(),
      success: result?.success,
      amount: result?.amount,
      amountStr,
      safeAmount,
      minAmount: MIN_AMOUNT,
      maxAmount: MAX_AMOUNT
    });

    // Validate Gemini result
    let failReason = '';
    if (result.upi_id?.toLowerCase() !== UPI_ID.toLowerCase()) failReason += 'UPI ID mismatch. ';
    if (!result.success) failReason += 'Status not success. ';
    if (safeAmount < MIN_AMOUNT) failReason += 'Amount too low. ';
    if (safeAmount > MAX_AMOUNT) failReason += 'Amount exceeds bank limit. ';
    if (failReason) {
      // Defensive parse for amount
      const logAmount = typeof safeAmount === 'number' && !isNaN(safeAmount) ? safeAmount : 0;
      console.log('[TransitionLog.create] REJECTED amount:', logAmount, typeof logAmount, '| Reason:', failReason);
      // Log failed attempt as rejected
      await TransitionLog.create({
        transitionId: 'FAIL_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        userEmail,
        amount: logAmount,
        screenshotHash,
        status: 'rejected',
        adminNotes: 'Payment verification failed. ' + failReason,
        createdAt: new Date(),
        app: result?.app,
        transactionDate: result?.date
      });
      return NextResponse.json({ error: 'Payment verification failed. ' + failReason + 'Please upload a valid UPI payment screenshot.' }, { status: 400 });
    }

    // Log transition
    const transitionId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const logAmount = typeof safeAmount === 'number' && !isNaN(safeAmount) ? safeAmount : 0;
    console.log('[TransitionLog.create] VERIFIED amount:', logAmount, typeof logAmount);
    await TransitionLog.create({
      transitionId,
      userEmail,
      amount: logAmount,
      screenshotHash,
      status: 'verified',
      createdAt: new Date(),
      app: result.app,
      transactionDate: result.date,
      transactionId: transactionId || undefined
    });

    // Add coins to user wallet
    await User.findOneAndUpdate(
      { email: userEmail },
      {
        $inc: { coins: safeAmount },
        $set: { retryCount: 0 },
      }
    );
    rateLimiter.resetRateLimit(userEmail, 'payment');

    return NextResponse.json({
      upi_id: result.upi_id,
      amount: safeAmount,
      app: result.app,
      date: result.date,
      status: 'success'
    }, { status: 200 });

  } catch (error) {
    // Log all other errors as rejected (except missing required fields)
    if (req && req.formData) {
      try {
        const formData = await req.formData();
        const userEmail = formData.get('userEmail');
        const screenshot = formData.get('screenshot');
        if (userEmail && screenshot) {
          let screenshotHash = '';
          try {
            const imageBuffer = Buffer.from(await screenshot.arrayBuffer());
            screenshotHash = require('crypto').createHash('sha256').update(imageBuffer).digest('hex');
          } catch {}
          // Defensive parse for amount in error handler
          const logAmount = 0;
          console.log('[TransitionLog.create] ERROR amount:', logAmount, typeof logAmount);
          await TransitionLog.create({
            transitionId: 'FAIL_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            userEmail,
            amount: logAmount,
            screenshotHash,
            status: 'rejected',
            adminNotes: error.message || 'Verification failed',
            createdAt: new Date()
          });
        }
      } catch {}
    }
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
} 