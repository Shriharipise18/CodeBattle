import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from '../utils/validation.js';

export const authLimiter = rateLimit(rateLimitConfig.auth);
export const apiLimiter = rateLimit(rateLimitConfig.api);
export const submissionLimiter = rateLimit(rateLimitConfig.submission);

export const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      error: 'Validation Error',
      details: messages
    });
  }

  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(409).json({
      error: `${field} already exists`
    });
  }

  // JWT error
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error'
  });
};