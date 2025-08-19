import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/users';
import TransitionLog from '@/lib/models/transitionLog';
import { rateLimiter } from '@/lib/rateLimiter';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const UPI_ID = "turraniesports@ibl";
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1000;

export async function POST(req) {
  try {
    await dbConnect();
    const formData = await req.formData();
    
    const userEmail = formData.get('userEmail');
    const screenshot = formData.get('screenshot');
    
    if (!userEmail || !screenshot) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rateLimitCheck = rateLimiter.isRateLimited(userEmail, 'payment', 5, 60 * 1000);
    if (rateLimitCheck.limited) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        remainingTime: Math.ceil(rateLimitCheck.remainingTime / 1000),
        attempts: rateLimitCheck.attempts
      }, { status: 429 });
    }

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

    const imageBuffer = Buffer.from(await screenshot.arrayBuffer());
    const base64Image = imageBuffer.toString('base64');
    const screenshotHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');

    const duplicateStatuses = ['verified', 'admin_accepted', 'done', 'pending'];
    const existingTransitionByHash = await TransitionLog.findOne({
      screenshotHash,
      status: { $in: duplicateStatuses }
    });
    if (existingTransitionByHash) {
      await TransitionLog.updateOne(
        { _id: existingTransitionByHash._id },
        { $inc: { duplicateCount: 1 } }
      );
      return NextResponse.json({ error: 'Duplicate screenshot detected. This payment has already been used.' }, { status: 400 });
    }

    const prompt = `You are a strict UPI payment screenshot verifier. Extract the following from the uploaded screenshot:\n\n1. UPI ID of receiver (e.g. turraniesports@ibl)\n2. Amount paid (e.g. ₹50)\n3. Transaction status (Success/Failure)\n4. App used (PhonePe, Google Pay, Paytm)\n5. Date and time of transaction (if available)\n6. UTR or Transaction ID (e.g., 2024081912345678901234)\n\nMake sure to detect **only real screenshots** from official UPI apps.\n\nReply in this strict JSON format:\n\n{\n  \"upi_id\": \"\",\n  \"amount\": \"\",\n  \"success\": true,\n  \"app\": \"\",\n  \"date\": \"\",\n  \"utr\": \"\"\n}`;

    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const res = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: screenshot.type, data: base64Image } }
    ]);
    
    const geminiText = res.response.text();

    let result;
    try {
      const jsonMatch = geminiText?.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      if (!result) {
          throw new Error('Could not parse JSON from Gemini response.');
      }
    } catch (e) {
      console.error('Gemini JSON parse error:', e.message);
      const updatedUser = await User.findOneAndUpdate(
        { email: userEmail },
        { $inc: { retryCount: 1 } },
        { new: true }
      );

      if (updatedUser.retryCount >= 3) {
        updatedUser.isSnoozed = true;
        updatedUser.snoozeReason = 'Multiple verification failures';
        updatedUser.snoozeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await updatedUser.save();
      }

      await TransitionLog.create({
        transitionId: 'FAIL_' + Date.now(),
        userEmail,
        amount: 0,
        screenshotHash,
        status: 'rejected',
        adminNotes: 'Could not parse Gemini response.',
        createdAt: new Date(),
      });
      return NextResponse.json({
        error: 'Could not read payment details from screenshot. Please try a clearer screenshot or a different UPI app.',
        retryCount: updatedUser.retryCount,
        isSnoozed: updatedUser.isSnoozed,
        snoozeExpiry: updatedUser.snoozeExpiry
      }, { status: 400 });
    }

    // Now that we've handled the parsing error, we can safely proceed with validation
    const utr = result?.utr || null;
    if (utr) {
      const existingTxnByUtr = await TransitionLog.findOne({
        utr,
        status: { $in: duplicateStatuses }
      });
      if (existingTxnByUtr) {
        await TransitionLog.updateOne(
          { _id: existingTxnByUtr._id },
          { $inc: { duplicateCount: 1 } }
        );
        return NextResponse.json({ error: 'Duplicate UPI transaction detected. This UTR has already been used.' }, { status: 400 });
      }
    }

    const amountStr = (result?.amount || '').replace(/[^0-9.]/g, '');
    const parsedAmount = Number(amountStr);
    const safeAmount = isNaN(parsedAmount) ? 0 : parsedAmount;

    let failReason = '';
    // Use optional chaining for safe access
    if (result.upi_id?.toLowerCase() !== UPI_ID.toLowerCase()) failReason += 'UPI ID mismatch. ';
    if (!result.success) failReason += 'Status not success. ';
    if (safeAmount < MIN_AMOUNT) failReason += 'Amount too low. ';
    if (safeAmount > MAX_AMOUNT) failReason += 'Amount exceeds bank limit. ';

    if (failReason) {
      const updatedUser = await User.findOneAndUpdate(
        { email: userEmail },
        { $inc: { retryCount: 1 } },
        { new: true }
      );

      if (updatedUser.retryCount >= 3) {
        updatedUser.isSnoozed = true;
        updatedUser.snoozeReason = 'Multiple verification failures';
        updatedUser.snoozeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await updatedUser.save();
      }

      await TransitionLog.create({
        transitionId: 'FAIL_' + Date.now(),
        userEmail,
        amount: safeAmount,
        screenshotHash,
        utr: result?.utr || undefined,
        status: 'rejected',
        adminNotes: 'Payment verification failed. ' + failReason,
        createdAt: new Date(),
        app: result?.app,
        transactionDate: result?.date
      });
      return NextResponse.json({
        error: 'Payment verification failed. ' + failReason,
        retryCount: updatedUser.retryCount,
        isSnoozed: updatedUser.isSnoozed,
        snoozeExpiry: updatedUser.snoozeExpiry
      }, { status: 400 });
    }
    
    const transitionId = 'TXN_' + Date.now();
    await TransitionLog.create({
      transitionId,
      userEmail,
      amount: safeAmount,
      screenshotHash,
      utr: result.utr,
      status: 'verified',
      createdAt: new Date(),
      app: result.app,
      transactionDate: result.date
    });

    await User.findOneAndUpdate(
      { email: userEmail },
      { $inc: { coins: safeAmount }, $set: { retryCount: 0 } }
    );
    rateLimiter.resetRateLimit(userEmail, 'payment');

    return NextResponse.json({
      upi_id: result.upi_id,
      amount: safeAmount,
      app: result.app,
      date: result.date,
      utr: result.utr,
      status: 'success'
    }, { status: 200 });

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}