import mongoose from 'mongoose';

const stageSchema = new mongoose.Schema({
  stageName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'completed'],
    default: 'open'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  }
});

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 0
  }
});

const eventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true
  },
  eventName: { 
    type: String, 
    required: true,
    trim: true
  },
  banner: { 
    type: String, 
    default: 'https://freeimage.host/i/FCqtWHN'
  },
  status: {
    type: String,
    enum: ['upcoming', 'running', 'completed'],
    default: 'upcoming'
  },
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date, 
    required: true 
  },
  entryFee: { 
    type: Number, 
    required: true,
    min: 0
  },
  totalWinnings: { 
    type: Number, 
    required: true,
    min: 0
  },
  stages: {
    type: [stageSchema],
    default: []
  },
  teams: {
    type: [teamSchema],
    default: []
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for faster queries
eventSchema.index({ status: 1, startTime: 1 });
eventSchema.index({ eventId: 1 }, { unique: true });

// Virtual for checking if event is active
eventSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.startTime <= now && now <= this.endTime;
});

// Pre-save middleware to generate eventId if not provided
eventSchema.pre('save', function(next) {
  if (!this.eventId) {
    this.eventId = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

const Events = mongoose.models.Events || mongoose.model('Events', eventSchema);

export default Events;
