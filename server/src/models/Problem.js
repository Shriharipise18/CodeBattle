import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  expectedOutput: {
    type: String,
    required: true
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  weight: {
    type: Number,
    default: 1
  }
});

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['arrays', 'strings', 'dynamic-programming', 'graphs', 'trees', 'sorting', 'searching', 'math']
  },
  constraints: {
    timeLimit: { type: Number, default: 2000 }, // milliseconds
    memoryLimit: { type: Number, default: 128 }, // MB
    inputSize: String
  },
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  testCases: [testCaseSchema],
  starterCode: {
    javascript: String,
    python: String,
    java: String,
    cpp: String,
    c: String
  },
  solution: {
    javascript: String,
    python: String,
    java: String,
    cpp: String,
    c: String
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usageStats: {
    timesUsed: { type: Number, default: 0 },
    averageCompletionTime: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes
problemSchema.index({ difficulty: 1 });
problemSchema.index({ category: 1 });
problemSchema.index({ isActive: 1 });
problemSchema.index({ tags: 1 });

export const Problem = mongoose.model('Problem', problemSchema);