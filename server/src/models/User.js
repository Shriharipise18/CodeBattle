import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  rating: {
    type: Number,
    default: 1200,
    min: 0
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  gamesWon: {
    type: Number,
    default: 0
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  profile: {
    avatar: String,
    bio: String,
    preferredLanguages: [{
      type: String,
      enum: ['javascript', 'python', 'java', 'cpp', 'c']
    }]
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update user statistics
userSchema.methods.updateStats = async function(won, ratingChange) {
  this.gamesPlayed += 1;
  if (won) this.gamesWon += 1;
  this.rating += ratingChange;
  this.rating = Math.max(0, this.rating); // Prevent negative rating
  return this.save();
};

export const User = mongoose.model('User', userSchema);