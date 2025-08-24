const { response } = require('../utils/response');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', err);

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json(response(false, null, `${field} already exists`));
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

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json(response(false, null, message));
};

module.exports = errorHandler;