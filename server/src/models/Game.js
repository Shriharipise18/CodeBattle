import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true,
    enum: ['javascript', 'python', 'java', 'cpp', 'c']
  },
  result: {
    status: String,
    executionTime: Number,
    memory: Number,
    testsPassed: Number,
    totalTests: Number,
    score: Number,
    submissionTime: { type: Date, default: Date.now }
  }
});

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    rating: Number,
    isBot: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now }
  }],
  spectators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    joinedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['waiting', 'starting', 'in-progress', 'finished', 'cancelled'],
    default: 'waiting'
  },
  settings: {
    maxPlayers: { type: Number, default: 2 },
    timeLimit: { type: Number, default: 1800000 }, // 30 minutes in ms
    difficultyLevel: { type: String, enum: ['easy', 'medium', 'hard'] }
  },
  submissions: [submissionSchema],
  startTime: Date,
  endTime: Date,
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  finalScores: [{
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: Number,
    completionTime: Number,
    submissions: Number
  }]
}, {
  timestamps: true
});

// Indexes for performance
gameSchema.index({ gameId: 1 });
gameSchema.index({ status: 1 });
gameSchema.index({ 'players.userId': 1 });
gameSchema.index({ createdAt: -1 });

export const Game = mongoose.model('Game', gameSchema);