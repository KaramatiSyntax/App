import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'host', 'manager'],
    default: 'user',
  },
  coins: {
    type: Number,
    default: 0,
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
  isVerified: {
    type: Boolean,
    default: false,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  lastLogin: {
    type: Date,
  },
  imageUrl: {
    type: String,
  },
  referralCode: {
    type: String,
    unique: true,
  },
  referredBy: { // Add referredBy field
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// DISABLED: Password hashing for demo purposes - storing as plain text
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) {
//     return next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

userSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Generate a gamer-style referral code: first 4 letters of username (or "USER"), plus 3 random alphanumeric chars
    const base = (this.username || 'USER').replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase().padEnd(4, 'X');
    let code;
    let existingUser;
    do {
      const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      code = `${base}${suffix}`;
      existingUser = await mongoose.models.User.findOne({ referralCode: code });
    } while (existingUser);
    this.referralCode = code;
  }
  next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User