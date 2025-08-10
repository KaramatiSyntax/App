import dbConnect from '@/lib/dbConnect';
import Payment from '@/lib/models/payments';
import User from '@/lib/models/users';
import TransitionLog from '@/lib/models/transitionLog';
import notificationService from '@/lib/notificationService';
import { rateLimiter } from '@/lib/rateLimiter';
import { GoogleGenAI } from "@google/genai";
import ExifReader from 'exifreader';
import Tesseract from 'tesseract.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  await dbConnect();
  
  // Check if the request is FormData or JSON
  const contentType = req.headers.get('content-type');
  let userEmail, amount, transactionId, transitionId;
  
  if (contentType && contentType.includes('multipart/form-data')) {
    // Handle FormData (for payment verification)
    const formData = await req.formData();
    userEmail = formData.get('userEmail');
    const screenshot = formData.get('screenshot');
    
    if (!userEmail || !screenshot) {
      return new Response(JSON.stringify({ error: 'Missing required fields: userEmail or screenshot' }), { status: 400 });
    }

    try {
      // 1. Check rate limiting
      const rateLimitCheck = rateLimiter.isRateLimited(userEmail, 'payment', 5, 60000);
      if (rateLimitCheck.limited) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          remainingTime: Math.ceil(rateLimitCheck.remainingTime / 1000),
          attempts: rateLimitCheck.attempts
        }), { status: 429 });
      }

      // 2. Check if user is blacklisted or snoozed
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
      }

      if (user.isSnoozed) {
        return new Response(JSON.stringify({ 
          error: 'Account is snoozed',
          snoozeReason: user.snoozeReason,
          snoozeExpiry: user.snoozeExpiry
        }), { status: 403 });
      }

      // Convert image to base64 for AI
      const imageBuffer = Buffer.from(await screenshot.arrayBuffer());
      const base64Image = imageBuffer.toString('base64');
      const mimeType = screenshot.type || 'image/jpeg';
      const imageSizeMB = imageBuffer.length / (1024 * 1024);
      if (imageSizeMB > 4) {
        throw new Error('Image size too large. Please use an image smaller than 4MB.');
      }

      // EXIF/metadata check for editing software
      let exifTags = {};
      try {
        exifTags = ExifReader.load(imageBuffer);
      } catch (exifErr) {
        // Ignore EXIF errors, proceed
      }
      const softwareTag = (exifTags.Software?.description || '').toLowerCase();
      const editingApps = ['photoshop', 'picsart', 'snapseed', 'canva', 'adobe', 'lightroom', 'pixlr', 'gimp', 'edit', 'editor'];
      if (editingApps.some(app => softwareTag.includes(app))) {
        return new Response(JSON.stringify({
          error: 'Screenshot appears to be edited. Please upload the original payment screenshot.'
        }), { status: 400 });
      }

      // Watermark/editing app overlay detection (OCR)
      try {
        const { data: { text: ocrText } } = await Tesseract.recognize(imageBuffer, 'eng');
        const suspiciousWords = ['picsart', 'adobe', 'snapseed', 'canva', 'edit', 'editor', 'watermark'];
        if (ocrText && suspiciousWords.some(word => ocrText.toLowerCase().includes(word))) {
          return new Response(JSON.stringify({
            error: 'Screenshot contains a watermark or editing app overlay. Please upload the original payment screenshot.'
          }), { status: 400 });
        }
      } catch (ocrErr) {
        // Ignore OCR errors, proceed
      }

      // Prepare the prompt for Gemini
      const prompt = `Analyze this UPI payment screenshot and extract payment details. Return ONLY a valid JSON object with this exact structure:
{
  "verified_percentage": 0,
  "amount": 0,
  "date": null,
  "time": null,
  "transaction_id": null,
  "recipient_name": null,
  "upi_id": null,
  "status": "unknown",
  "confidence_score": 0,
  "verification_details": {
    "amount_verified": false,
    "recipient_verified": false,
    "date_verified": false,
    "upi_verified": false
  },
  "extracted_text": "",
  "verification_notes": ""
}
Rules:
1. Look for UPI payment details, amounts, dates, times, recipient info
2. Check if recipient is 'Vinayak Kumar Shukla' (case-insensitive). If not, say so in verification_notes.
3. Amount should be between ₹1 and ₹1,000
4. Date should be recent (within 24 hours) but don't fail if older
5. Look for success status indicators
6. Return ONLY valid JSON, no other text
7. Use null for missing information
8. verified_percentage based on visible information and expected values
9. If image is blurry or details are unreadable, set verification_notes to 'Image quality poor or details unreadable'.`;

      // Call Gemini API directly
      let responseText;
      try {
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64Image } }
            ]
          }
        ],
        config: { thinkingConfig: { thinkingBudget: 0 } }
      });
        responseText = res.text?.trim();
      if (!responseText) {
        throw new Error('No response from Gemini API');
        }
      } catch (geminiError) {
        throw new Error(`Gemini API error: ${geminiError.message}`);
      }

      // Extract JSON from Gemini response
      let verificationResult;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          verificationResult = JSON.parse(jsonMatch[0]);
        } else {
          verificationResult = {
            verified_percentage: 0,
            amount: 0,
            date: null,
            time: null,
            transaction_id: null,
            recipient_name: null,
            upi_id: null,
            status: 'unknown',
            confidence_score: 0,
            verification_details: {
              amount_verified: false,
              recipient_verified: false,
              date_verified: false,
              upi_verified: false
            },
            extracted_text: responseText || '',
            verification_notes: 'Failed to parse structured response'
          };
        }
      } catch (parseError) {
        verificationResult = {
          verified_percentage: 0,
          amount: 0,
          date: null,
          time: null,
          transaction_id: null,
          recipient_name: null,
          upi_id: null,
          status: 'unknown',
          confidence_score: 0,
          verification_details: {
            amount_verified: false,
            recipient_verified: false,
            date_verified: false,
            upi_verified: false
          },
          extracted_text: responseText || '',
          verification_notes: 'Failed to parse structured response'
        };
      }

      // Strict recipient name check (generic error)
      const recipientName = verificationResult.recipient_name?.trim().toLowerCase() || '';
      if (recipientName !== 'vinayak kumar shukla') {
        return new Response(JSON.stringify({
          error: 'Recipient name not matched. Please upload a valid payment screenshot.',
          verification_notes: verificationResult.verification_notes || '',
        }), { status: 400 });
      }

      // Screenshot date must match today
      const extractedDate = verificationResult.date;
      if (extractedDate) {
        const today = new Date();
        const extracted = new Date(extractedDate);
        // Compare only the date part (year, month, day)
        if (
          today.getFullYear() !== extracted.getFullYear() ||
          today.getMonth() !== extracted.getMonth() ||
          today.getDate() !== extracted.getDate()
        ) {
          return new Response(JSON.stringify({
            error: 'Screenshot date does not match today. Please upload a recent payment screenshot.',
            verification_notes: verificationResult.verification_notes || '',
          }), { status: 400 });
        }
      } else {
        return new Response(JSON.stringify({
          error: 'Screenshot date could not be extracted. Please upload a valid payment screenshot.',
          verification_notes: verificationResult.verification_notes || '',
        }), { status: 400 });
      }

      // Require all payment details
      if (!verificationResult.transaction_id || !verificationResult.amount || !verificationResult.date || !verificationResult.time || !verificationResult.recipient_name || !verificationResult.upi_id) {
        return new Response(JSON.stringify({
          error: 'Missing or unreadable payment details (transaction ID, amount, date, time, recipient name, or UPI ID).',
          verification_notes: verificationResult.verification_notes || '',
        }), { status: 400 });
      }

      // Image quality check
      if ((verificationResult.verification_notes || '').toLowerCase().includes('quality') || (verificationResult.verification_notes || '').toLowerCase().includes('unreadable')) {
        return new Response(JSON.stringify({
          error: 'Image quality is poor or details are not visible.',
          verification_notes: verificationResult.verification_notes || '',
        }), { status: 400 });
      }

      // AI confidence threshold
      if ((verificationResult.verified_percentage || 0) <= 70) {
        return new Response(JSON.stringify({
          error: 'Verification confidence is too low. Please upload a clearer screenshot.',
          verified_percentage: verificationResult.verified_percentage || 0,
          verification_notes: verificationResult.verification_notes || '',
        }), { status: 400 });
      }

      // Only now generate screenshot hash and check for duplicates
      const crypto = require('crypto');
      const screenshotHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
      // Check for any existing screenshot hash, regardless of status
      const existingTransition = await TransitionLog.findOne({ 
        screenshotHash
      });
      if (existingTransition) {
        // Log duplicate attempt
        await TransitionLog.create({
          transitionId: 'DUPLICATE_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          userEmail,
          amount: 0,
          screenshotHash,
          status: 'duplicate',
          adminNotes: 'Duplicate screenshot detected',
          createdAt: new Date()
        });
        return new Response(JSON.stringify({ 
          error: 'Duplicate screenshot detected',
          retryCount: user.retryCount || 0
        }), { status: 400 });
      }

      // Success - Create transition log entry with hash
      const transitionId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const transitionLog = await TransitionLog.create({
        transitionId,
        userEmail,
        amount: verificationResult.amount || 0,
        screenshotHash,
        status: 'verified',
        createdAt: new Date()
      });
      // Success - add coins to wallet
      await User.findOneAndUpdate(
        { email: userEmail },
        { 
          $inc: { coins: verificationResult.amount || 0 },
          $set: { retryCount: 0 } // Reset retry count on success
        }
      );
      rateLimiter.resetRateLimit(userEmail, 'payment');
      return new Response(JSON.stringify({
        verified_percentage: verificationResult.verified_percentage,
        amount: verificationResult.amount || 0,
        date: verificationResult.date || new Date().toISOString(),
        transaction_id: verificationResult.transaction_id || transitionId,
        status: 'success',
        transitionId: transitionLog._id
      }), { status: 200 });
    } catch (error) {
      // Failed verification - increment retry count (no hash saved)
      const user = await User.findOne({ email: userEmail });
      if (user) {
        user.retryCount = (user.retryCount || 0) + 1;
        user.lastRetryDate = new Date();
        if (user.retryCount >= 3) {
          user.isSnoozed = true;
          user.snoozeReason = 'Multiple verification failures';
          user.snoozeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        }
        await user.save();
      }
      // Log the failed attempt in transition logs
      try {
        await TransitionLog.create({
          transitionId: 'FAIL_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          userEmail,
          amount: 0,
          screenshotHash: '',
          status: 'failed',
          adminNotes: error.message || 'Unknown error',
          createdAt: new Date()
        });
      } catch (logError) {
        console.error('Failed to log failed transition:', logError);
      }
      return new Response(JSON.stringify({ 
        error: error.message || 'Payment verification failed',
        retryCount: user?.retryCount,
        isSnoozed: user?.isSnoozed,
        snoozeExpiry: user?.snoozeExpiry
      }), { status: 400 });
    }
  } else {
    // Handle JSON (for direct coin addition)
    const body = await req.json();
    userEmail = body.userEmail;
    amount = body.amount;
    transactionId = body.transactionId;
    transitionId = body.transitionId;
    
    if (!userEmail || !amount || !transactionId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    
    // Validate amount for direct coin addition
    if (typeof amount !== 'number' || amount < 1 || amount > 1000) {
      return new Response(JSON.stringify({ 
        error: 'Invalid amount. Amount must be between ₹1 and ₹1000.' 
      }), { status: 400 });
    }
  }
  
  // 1. Add coins to user wallet
  const user = await User.findOneAndUpdate(
    { email: userEmail },
    { $inc: { coins: amount } },
    { new: true }
  );
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }
  
  // 2. Create payment record (pending)
  const paymentData = {
    userEmail,
    amount,
    status: 'pending',
    transactionId,
  };
  
  if (transitionId) {
    paymentData.transitionId = transitionId;
  }
  
  const payment = await Payment.create(paymentData);
  
  // 3. Update transition log with payment ID if transitionId exists
  if (transitionId) {
    await TransitionLog.findOneAndUpdate(
      { transitionId },
      { paymentId: payment._id }
    );
  }
  
  // 4. Send notification
  // await notificationService.sendNotification(
  //   userEmail,
  //   'Coins Added (Pending Approval)',
  //   `₹${amount} coins have been added to your wallet and are pending admin approval.`
  // );
  
  return new Response(JSON.stringify({ success: true, user, payment }), { status: 201 });
}

export async function GET(req) {
  await dbConnect();
  
  const { searchParams } = new URL(req.url);
  const userEmail = searchParams.get('userEmail');
  const limit = parseInt(searchParams.get('limit')) || 10;
  
  if (!userEmail) {
    return new Response(JSON.stringify({ error: 'User email is required' }), { status: 400 });
  }
  
  try {
    const payments = await Payment.find({ userEmail })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    return new Response(JSON.stringify(payments), { status: 200 });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch payments' }), { status: 500 });
  }
}

export async function PATCH(req) {
  await dbConnect();
  const body = await req.json();
  const { paymentId, action } = body; // action: 'approve' or 'reject'
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return new Response(JSON.stringify({ error: 'Payment not found' }), { status: 404 });
  }
  if (action === 'approve') {
    payment.status = 'verified';
    await payment.save();
    // await notificationService.sendNotification(
    //   payment.userEmail,
    //   'Coins Approved',
    //   `Your payment of ₹${payment.amount} has been approved by admin.`
    // );
    return new Response(JSON.stringify({ success: true, payment }), { status: 200 });
  } else if (action === 'reject') {
    payment.status = 'rejected';
    await payment.save();
    // Deduct coins from user wallet
    await User.findOneAndUpdate(
      { email: payment.userEmail },
      { $inc: { coins: -payment.amount } }
    );
    // await notificationService.sendNotification(
    //   payment.userEmail,
    //   'Coins Deducted (Payment Rejected)',
    //   `Your payment of ₹${payment.amount} was rejected by admin. Coins have been deducted from your wallet.`
    // );
    return new Response(JSON.stringify({ success: true, payment }), { status: 200 });
  } else {
    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  }
}