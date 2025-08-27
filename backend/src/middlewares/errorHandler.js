const { response } = require('../utils/response');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', err.stack || err);

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json(response(false, null, `${field} already exists`));
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json(response(false, null, 'Validation failed', { errors }));
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(response(false, null, 'Invalid token'));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(response(false, null, 'Token expired'));
  }

  // Ethers.js error (blockchain related)
  if (err.code === 'CALL_EXCEPTION') {
    return res.status(400).json(response(false, null, 'Blockchain transaction failed', { reason: err.reason }));
  }

  if (err.code === 'INSUFFICIENT_FUNDS') {
    return res.status(400).json(response(false, null, 'Insufficient funds for transaction'));
  }

  if (err.code === 'NETWORK_ERROR') {
    return res.status(503).json(response(false, null, 'Blockchain network error'));
  }

  // Rate limiting error
  if (err instanceof Error && err.message === 'Too many requests') {
    return res.status(429).json(response(false, null, 'Too many requests'));
  }

  // Custom application error
  if (err.isOperational) {
    return res.status(err.statusCode).json(response(false, null, err.message));
  }

  // Default error (don't leak details in production)
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(statusCode).json(response(false, null, message));
};

// Utility to create consistent operational errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };