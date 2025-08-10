import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: String,
  points: {
    type: Number,
    default: 0
  },
  slotNo: Number,
  inGameName: String,
  team: String,
  teamSlot: Number
});

const matchSchema = new mongoose.Schema({
  matchId: { 
    type: String, 
    trim: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  banner: { 
    type: String, 
    default: 'https://freeimage.host/i/FCqtWHN' // Made optional with default
  },
  roomId: {
    type: String,
    default: ''
  },
  roomPassword: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['upcoming', 'running', 'completed'],
    default: 'upcoming'
  },
  time: { 
    type: Date, 
    required: true
  },
  entry: { 
    type: Number, 
    default: 0
  },
  winnings: { 
    type: String, 
    required: true
  },
  matchType: {
    type: String,
    enum: ['cs', 'lw', 'br'],
    required: true
  },
  matchFormat: { 
    type: String, 
    default: 'Squad',
    enum: ['Solo', 'Duo', 'Squad']
  },
  rules: { 
    type: String, 
    default: 'No PC allowed, default rules apply'
  },
  maxParticipants: { 
    type: Number, 
    default: 48
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  teams: [{
    teamName: String,
    players: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    score: { type: Number, default: 0 }
  }],
  players: {
    type: [playerSchema],
    default: []
  },
  createdBy: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for faster queries
matchSchema.index({ status: 1, time: 1 });

// Virtual for checking if match is full
matchSchema.virtual('isFull').get(function() {
  return this.participants.length >= this.maxParticipants;
});

const Matches = mongoose.models.Matches || mongoose.model('Matches', matchSchema);

export default Matches;