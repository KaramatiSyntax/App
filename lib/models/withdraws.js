import mongoose from 'mongoose';

const withdrawSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  upiId: { type: String, required: true },
  withdrawAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed'], 
    default: 'pending' 
  },
  transactionId: { type: String },
  adminNotes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { collection: 'withdraws' });

// Update the updatedAt field before saving
withdrawSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Withdraw = mongoose.models.Withdraw || mongoose.model('Withdraw', withdrawSchema);

export default Withdraw; 