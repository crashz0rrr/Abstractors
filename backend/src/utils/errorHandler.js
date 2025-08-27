const logger = require('./logger');

/**
 * Custom AppError class for operational errors
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Blockchain-specific errors
 */
class BlockchainError extends AppError {
  constructor(message, transactionHash = null, reason = null) {
    super(message, 400);
    this.transactionHash = transactionHash;
    this.reason = reason;
    this.name = 'BlockchainError';
  }
}

class InsufficientFundsError extends BlockchainError {
  constructor(required, available, currency = 'ETH') {
    super(`Insufficient funds. Required: ${required} ${currency}, Available: ${available} ${currency}`);
    this.required = required;
    this.available = available;
    this.currency = currency;
    this.name = 'InsufficientFundsError';
  }
}

class ContractCallError extends BlockchainError {
  constructor(methodName, contractAddress, errorData) {
    super(`Contract call failed: ${methodName} at ${contractAddress}`);
    this.methodName = methodName;
    this.contractAddress = contractAddress;
    this.errorData = errorData;
    this.name = 'ContractCallError';
  }
}

/**
 * Validation errors
 */
class ValidationError extends AppError {
  constructor(errors, message = 'Validation failed') {
    super(message, 400);
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

/**
 * Authentication & Authorization errors
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class TokenExpiredError extends AuthenticationError {
  constructor(message = 'Token expired') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

/**
 * Resource errors
 */
class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} ${id ? `with id ${id}` : ''} not found`, 404);
    this.resource = resource;
    this.id = id;
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(resource, message = 'Resource already exists') {
    super(message, 409);
    this.resource = resource;
    this.name = 'ConflictError';
  }
}

/**
 * Rate limiting error
 */
class RateLimitError extends AppError {
  constructor(retryAfter = null, message = 'Too many requests') {
    super(message, 429);
    this.retryAfter = retryAfter;
    this.name = 'RateLimitError';
  }
}

/**
 * Database errors
 */
class DatabaseError extends AppError {
  constructor(operation, error, message = 'Database operation failed') {
    super(message, 500);
    this.operation = operation;
    this.originalError = error;
    this.name = 'DatabaseError';
  }
}

/**
 * Cache errors
 */
class CacheError extends AppError {
  constructor(operation, error, message = 'Cache operation failed') {
    super(message, 500);
    this.operation = operation;
    this.originalError = error;
    this.name = 'CacheError';
  }
}

/**
 * External service errors
 */
class ExternalServiceError extends AppError {
  constructor(serviceName, error, message = 'External service unavailable') {
    super(message, 503);
    this.serviceName = serviceName;
    this.originalError = error;
    this.name = 'ExternalServiceError';
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log operational errors differently than programming errors
  if (err.isOperational) {
    logger.warn('Operational Error:', {
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
      ...err
    });
  } else {
    logger.error('Programming Error:', {
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
      ...err
    });
  }

  // Send different responses based on environment
  if (process.env.NODE_ENV === 'production') {
    // Production: Send minimal error information
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        message: err.message,
        ...(err.retryAfter && { retryAfter: err.retryAfter }),
        ...(err.transactionHash && { transactionHash: err.transactionHash })
      });
    } else {
      // Programming or unknown error: don't leak details
      res.status(500).json({
        success: false,
        message: 'Something went wrong!'
      });
    }
  } else {
    // Development: Send detailed error information
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err,
      stack: err.stack,
      ...(err.retryAfter && { retryAfter: err.retryAfter }),
      ...(err.transactionHash && { transactionHash: err.transactionHash })
    });
  }
};

/**
 * Async error wrapper to avoid try-catch blocks in controllers
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * 404 handler middleware
 */
const notFoundHandler = (req, res, next) => {
  next(new NotFoundError('Endpoint', req.originalUrl));
};

/**
 * Validate Ethereum address with proper error
 */
const validateEthereumAddress = (address, fieldName = 'address') => {
  const { isValidAddress } = require('./helpers');
  
  if (!address) {
    throw new ValidationError([{ field: fieldName, message: `${fieldName} is required` }]);
  }
  
  if (!isValidAddress(address)) {
    throw new ValidationError([{ field: fieldName, message: `Invalid Ethereum ${fieldName}` }]);
  }
  
  return true;
};

module.exports = {
  // Error classes
  AppError,
  BlockchainError,
  InsufficientFundsError,
  ContractCallError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  TokenExpiredError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  CacheError,
  ExternalServiceError,
  
  // Functions
  errorHandler,
  catchAsync,
  notFoundHandler,
  validateEthereumAddress
};