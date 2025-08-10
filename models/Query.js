import mongoose from "mongoose";

const QuerySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'replied'],
    default: 'unread',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  readAt: {
    type: Date,
    default: null,
  },
  repliedAt: {
    type: Date,
    default: null,
  },
  adminReply: {
    type: String,
    default: '',
  },
});

export default mongoose.models.Query || mongoose.model("Query", QuerySchema); 