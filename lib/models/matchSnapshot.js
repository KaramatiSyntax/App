import mongoose from 'mongoose';

const matchSnapshotSchema = new mongoose.Schema({
  matchId: String,
  name: String,
  banner: String,
  roomId: String,
  roomPassword: String,
  status: String,
  time: Date,
  entry: Number,
  winnings: String,
  matchType: String,
  matchFormat: String,
  rules: String,
  maxParticipants: Number,
  participants: [String], // store user IDs as strings
  teams: [{}], // store as raw objects
  players: [{}], // store as raw objects
  createdBy: String, // manager name or ID
  originalMatchId: String, // reference to original _id if needed
  snapshotAt: { type: Date, default: Date.now },
  // Store any extra fields from the match document
  extra: { type: Object, default: {} }
});

const MatchSnapshot = mongoose.models.MatchSnapshot || mongoose.model('MatchSnapshot', matchSnapshotSchema);

export default MatchSnapshot; 