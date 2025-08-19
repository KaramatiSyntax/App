import mongoose from 'mongoose';

const transitionLogSchema = new mongoose.Schema({
  // Unique identifier for the transition log entry, ensuring no duplicates.
  transitionId: {
    type: String,
    required: true,
    unique: true,
  },
  
  // Email of the user who initiated the payment verification.
  userEmail: {
    type: String,
    required: true,
  },
  
  // Amount paid in the transaction.
  amount: {
    type: Number,
    required: true,
  },
  
  // Unique hash of the payment screenshot to prevent duplicate uploads.
  screenshotHash: {
    type: String,
    required: true,
    unique: true,
  },

  // Unique Transaction Reference (UTR) extracted from the screenshot.
  // The 'sparse' index allows for null values, as some screenshots may not have a UTR.
  utr: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },

  // The status of the verification, with a list of allowed values.
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'duplicate', 'admin_accepted', 'done', 'failed'],
    default: 'pending',
  },
  
  // Reference to a related Payment document, if applicable.
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  
  // Date and time when the log entry was created.
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  // Date and time when the payment was successfully verified.
  verifiedAt: {
    type: Date,
  },
  
  // Optional notes from an administrator regarding the transaction.
  adminNotes: {
    type: String,
  },
  
  // Boolean flag to indicate if the user is snoozed due to multiple failures.
  isSnoozed: {
    type: Boolean,
    default: false,
  },
  
  // Reason for snoozing the user (e.g., 'Multiple verification failures').
  snoozeReason: {
    type: String,
  },
  
  // The date and time when the snooze period expires.
  snoozeExpiry: {
    type: Date,
  },
  
  // Count of how many times this specific screenshot hash has been submitted.
  duplicateCount: {
    type: Number,
    default: 0,
  },
  
  // The entity that performed the action (e.g., 'ai' for automatic verification).
  actionBy: {
    type: String,
    enum: ['admin', 'ai'],
    default: 'ai', // Default to 'ai' for automatic verifications
  },
}, {
  timestamps: true,
});

// Indexes for faster database lookups.
transitionLogSchema.index({ screenshotHash: 1 });
transitionLogSchema.index({ userEmail: 1 });
transitionLogSchema.index({ utr: 1, status: 1 });
transitionLogSchema.index({ createdAt: 1 });

const TransitionLog = mongoose.models.TransitionLog || mongoose.model('TransitionLog', transitionLogSchema);

export default TransitionLog;