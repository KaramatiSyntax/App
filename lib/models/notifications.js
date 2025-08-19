import mongoose, { Schema, model, models } from 'mongoose';

// =======================================================================
//  NOTIFICATION MESSAGE SUB-SCHEMA
// =======================================================================
// This is NOT a model. It's a schema that defines the structure of each
// individual notification object within the main Notification document's array.

const MessageSchema = new Schema({
  // A unique ID for each message, useful for marking a specific one as read.
  // Mongoose will automatically add a unique `_id` of type ObjectId,
  // so we don't need to define it explicitly unless we want a different type.

  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    default: '/notifications', // Link to the notifications page by default.
  },
  read: {
    type: Boolean,
    default: false,
  },
  // The `createdAt` is automatically added by the parent schema's timestamps,
  // but if you need a specific time for each message, you can add it here.
  sentAt: {
      type: Date,
      default: Date.now,
  }
});


// =======================================================================
//  MAIN NOTIFICATION SCHEMA
// =======================================================================
// This schema creates one document per user to store all their notifications.
// It's highly efficient for fetching a user's notification history.

const NotificationSchema = new Schema({
  // The crucial link to the user. Each user will have only ONE document
  // in this collection.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Ensures one notification document per user.
    index: true,
  },

  // An array containing all notification messages for this user.
  // We use the MessageSchema defined above to structure the objects
  // inside this array.
  messages: [MessageSchema],

}, {
  timestamps: true, // Adds `createdAt` and `updatedAt` to the main document.
});

// =======================================================================
//  EXPORT MODEL
// =======================================================================
export const Notification = models.Notification || model('Notification', NotificationSchema);
