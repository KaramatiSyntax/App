import mongoose from 'mongoose';

const transitionLogSchema = new mongoose.Schema({
  transitionId: {
    type: String,
    required: true,
    unique: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  screenshotHash: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'duplicate', 'admin_accepted', 'done', 'failed'],
    default: 'pending',
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  verifiedAt: {
    type: Date,
  },
  adminNotes: {
    type: String,
  },
  isSnoozed: {
    type: Boolean,
    default: false,
  },
  snoozeReason: {
    type: String,
  },
  snoozeExpiry: {
    type: Date,
  },
  duplicateCount: {
    type: Number,
    default: 0,
  },
  actionBy: {
    type: String,
    enum: ['admin', 'ai'],
    default: 'admin',
  },
}, {
  timestamps: true,
});

// Index for faster lookups
// transitionLogSchema.index({ transitionId: 1 }); // Removed duplicate index
transitionLogSchema.index({ screenshotHash: 1 });
transitionLogSchema.index({ userEmail: 1 });
transitionLogSchema.index({ isSnoozed: 1 });

const TransitionLog = mongoose.models.TransitionLog || mongoose.model('TransitionLog', transitionLogSchema);

export default TransitionLog; 