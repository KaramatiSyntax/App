import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Withdraw from "@/lib/models/withdraws";
import User from "@/lib/models/users";

// Helper function to safely update user coins with validation
const safelyUpdateUserCoins = async (userEmail, amountChange, operation, withdrawalId = null) => {
  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      throw new Error(`User not found: ${userEmail}`);
    }

    const oldBalance = user.coins || 0;
    const newBalance = Math.max(0, oldBalance + amountChange);

    // Validate the operation
    if (amountChange < 0 && Math.abs(amountChange) > oldBalance) {
      throw new Error(`Insufficient balance for withdrawal. Current: ${oldBalance}, Required: ${Math.abs(amountChange)}`);
    }

    user.coins = newBalance;
    await user.save();

    return { success: true, oldBalance, newBalance, user };
  } catch (error) {
    console.error(`[COIN_UPDATE_ERROR] ${operation} - User: ${userEmail}, Error:`, error.message);
    throw error;
  }
};

// Helper function to validate withdrawal data
const validateWithdrawalData = (data) => {
  const { userEmail, upiId, withdrawAmount } = data;
  
  if (!userEmail || !upiId || !withdrawAmount) {
    throw new Error("Missing required fields: userEmail, upiId, withdrawAmount");
  }

  if (typeof withdrawAmount !== 'number' || withdrawAmount < 10) {
    throw new Error("Invalid withdrawal amount. Minimum amount is ₹10");
  }

  if (withdrawAmount > 100000) {
    throw new Error("Withdrawal amount too high. Maximum allowed is ₹100,000");
  }

  if (!userEmail.includes('@')) {
    throw new Error("Invalid email format");
  }

  if (upiId.length < 3 || upiId.length > 50) {
    throw new Error("Invalid UPI ID format");
  }

  return true;
};

export async function POST(req) {
  try {
    await dbConnect();
    const withdrawalData = await req.json();

    // Validate withdrawal data
    validateWithdrawalData(withdrawalData);

    const { userEmail, upiId, withdrawAmount } = withdrawalData;

    // Check if user exists and has sufficient balance
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    if (user.isSnoozed) {
      return NextResponse.json(
        { error: "Your account is snoozed. You cannot redeem/withdraw during this period." },
        { status: 403 }
      );
    }

    const currentBalance = user.coins || 0;
    if (currentBalance < withdrawAmount) {
      return NextResponse.json(
        { error: `Insufficient balance. Current balance: ₹${currentBalance}, Required: ₹${withdrawAmount}` },
        { status: 400 }
      );
    }

    // Check for existing pending withdrawals from same user
    const existingPending = await Withdraw.findOne({
      userEmail,
      status: 'pending'
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "You already have a pending withdrawal request. Please wait for it to be processed." },
        { status: 400 }
      );
    }

    // Generate unique transaction ID
    const transactionId = `WITHDRAW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create withdrawal record
    const withdrawal = new Withdraw({
      userEmail,
      upiId,
      withdrawAmount,
      status: 'pending',
      transactionId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Save withdrawal record first
    await withdrawal.save();

    // Deduct coins from user's wallet
    await safelyUpdateUserCoins(userEmail, -withdrawAmount, 'WITHDRAWAL_DEDUCTION', withdrawal._id);

    return NextResponse.json({
      success: true,
      withdrawalId: withdrawal._id,
      transactionId: withdrawal.transactionId,
      newBalance: (user.coins || 0) - withdrawAmount,
      message: "Withdrawal request submitted successfully. Coins have been deducted from your wallet."
    });

  } catch (error) {
    console.error("[WITHDRAWAL_ERROR] Failed to process withdrawal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create withdrawal request" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const withdrawalId = searchParams.get('id');
    const { status, adminNotes } = await req.json();

    // Validate inputs
    if (!withdrawalId) {
      return NextResponse.json(
        { error: "Withdrawal ID is required" },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Find the withdrawal
    const withdrawal = await Withdraw.findById(withdrawalId);
    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal not found" },
        { status: 404 }
      );
    }

    const oldStatus = withdrawal.status;

    // Handle coin management based on status change
    let coinUpdateMessage = '';

    if (status === 'rejected' && oldStatus !== 'rejected') {
      // Return coins to user's wallet when rejecting
      try {
        await safelyUpdateUserCoins(withdrawal.userEmail, withdrawal.withdrawAmount, 'WITHDRAWAL_REJECTION_RETURN', withdrawalId);
        coinUpdateMessage = ' - Coins have been returned to user wallet';
      } catch (error) {
        console.error(`[STATUS_UPDATE_ERROR] Failed to return coins:`, error);
        return NextResponse.json(
          { error: "Failed to return coins to user wallet" },
          { status: 500 }
        );
      }
    } else if (status === 'approved' && oldStatus === 'rejected') {
      // If changing from rejected to approved, deduct coins again
      try {
        await safelyUpdateUserCoins(withdrawal.userEmail, -withdrawal.withdrawAmount, 'WITHDRAWAL_REAPPROVAL_DEDUCTION', withdrawalId);
        coinUpdateMessage = ' - Coins have been deducted from user wallet';
      } catch (error) {
        console.error(`[STATUS_UPDATE_ERROR] Failed to deduct coins:`, error);
        return NextResponse.json(
          { error: "Failed to deduct coins from user wallet" },
          { status: 500 }
        );
      }
    }

    // Update withdrawal status
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const updatedWithdrawal = await Withdraw.findByIdAndUpdate(
      withdrawalId,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      withdrawal: updatedWithdrawal,
      message: `Withdrawal status updated to ${status}${coinUpdateMessage}`,
      oldStatus,
      newStatus: status
    });

  } catch (error) {
    console.error("[STATUS_UPDATE_ERROR] Failed to update withdrawal status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update withdrawal status" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 100;

    let query = {};
    if (userEmail) {
      query.userEmail = userEmail;
    }
    if (status) {
      query.status = status;
    }

    const withdrawals = await Withdraw.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 1000)); // Prevent excessive queries

    return NextResponse.json(withdrawals);
  } catch (error) {
    console.error("[WITHDRAWAL_FETCH_ERROR] Failed to fetch withdrawals:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
} 