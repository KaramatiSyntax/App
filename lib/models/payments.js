import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  transactionId: { type: String, required: true },
  transitionId: { type: String }, // Link to transition log
  adminNotes: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'payments' });

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
