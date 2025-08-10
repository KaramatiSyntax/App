import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now, required: true },
  read: { type: Boolean, default: false },
  bookmarked: { type: Boolean, default: false }
}); 

const subscriptionSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  notifications: { type: [notificationSchema], default: [] },
  endpoint: { type: String, required: false },
  keys: {
    auth: { type: String, required: false },
    p256dh: { type: String, required: false }
  },
});

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
