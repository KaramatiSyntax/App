import mongoose, { Schema, model, models } from 'mongoose';

// =======================================================================
//  NOTIFICATION SUBSCRIPTION SCHEMA
// =======================================================================
// This schema stores the push subscription object that you get from the
// browser's Push API. Each document represents a single device/browser
// that has subscribed to notifications for a specific user.

const NotificationSubscriptionSchema = new Schema({
  // The unique endpoint URL provided by the push service (e.g., Google, Mozilla).
  // This is where you'll send the notification payload.
  endpoint: {
    type: String,
    required: true,
    unique: true, // Each endpoint is unique to a device/browser session.
  },
  
  // Expiration time for the subscription, if any.
  expirationTime: {
    type: Number, // Stored as a timestamp.
    default: null,
  },

  // The keys needed to encrypt the notification payload.
  // This ensures that only your server can send messages to this endpoint.
  keys: {
    p256dh: {
      type: String,
      required: true,
    },
    auth: {
      type: String,
      required: true,
    },
  },

  // This is the crucial link back to your User model.
  // It stores the ObjectId of the user who owns this subscription.
  // We'll add an index to make lookups faster.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // This tells Mongoose to reference the 'User' model.
    required: true,
    index: true,
  },
}, {
  timestamps: true, // Adds `createdAt` and `updatedAt` fields automatically.
});

// =======================================================================
//  USER SCHEMA
// =======================================================================
// A standard user schema. The important part is that the NotificationSubscription
// schema above will reference the `_id` of a document in this collection.

const UserSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    lowercase: true,
    trim: true,
    // Add an index to the email field for fast lookups when a user logs in.
    index: true, 
  },
  name: {
    type: String,
    required: [true, 'Name is required.'],
  },
  // You would add other user-related fields here, like password, profile picture, etc.
  // password: {
  //   type: String,
  //   required: true,
  // },
}, {
  timestamps: true,
});


// =======================================================================
//  EXPORT MODELS
// =======================================================================
// This pattern prevents Mongoose from recompiling the model on every hot-reload
// in a Next.js development environment.

export const NotificationSubscription = models.NotificationSubscription || model('NotificationSubscription', NotificationSubscriptionSchema);
export const User = models.User || model('User', UserSchema);


