const logger = require('./logger');

/**
 * Standard success response format
 */
const success = (res, message = 'Success', data = null, meta = null) => {
  const response = {
    success: true,
    message,
    data,
    meta: meta || {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    }
  };

  logger.info('API Success', { message, data: typeof data, hasMeta: !!meta });
  return res.status(200).json(response);
};

/**
 * Standard error response format
 */
const error = (res, message = 'Error', statusCode = 500, error = null, details = null) => {
  const response = {
    success: false,
    message,
    error: error ? error.message : null,
    details,
    meta: {
      timestamp: new Date().toISOString(),
      statusCode
    }
  };

  // Don't log client errors (4xx) as errors, just as warnings
  if (statusCode >= 500) {
    logger.error('API Error', { message, statusCode, error, details });
  } else {
    logger.warn('API Client Error', { message, statusCode, error, details });
  }

  return res.status(statusCode).json(response);
};

/**
 * Pagination response helper
 */
const paginated = (res, message, data, pagination) => {
  return success(res, message, data, {
    pagination,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
};

/**
 * Created response (201 status)
 */
const created = (res, message = 'Resource created', data = null) => {
  const response = {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      statusCode: 201
    }
  };

  logger.info('API Created', { message, data: typeof data });
  return res.status(201).json(response);
};

/**
 * No content response (204 status)
 */
const noContent = (res, message = 'No content') => {
  logger.info('API No Content', { message });
  return res.status(204).send();
};

/**
 * Standardized error responses
 */
const responses = {
  // Client errors
  badRequest: (res, message = 'Bad request', details = null) => 
    error(res, message, 400, null, details),
  
  unauthorized: (res, message = 'Unauthorized') => 
    error(res, message, 401),
  
  forbidden: (res, message = 'Forbidden') => 
    error(res, message, 403),
  
  notFound: (res, message = 'Not found') => 
    error(res, message, 404),
  
  conflict: (res, message = 'Conflict') => 
    error(res, message, 409),
  
  tooManyRequests: (res, message = 'Too many requests', retryAfter = null) => 
    error(res, message, 429, null, retryAfter ? { retryAfter } : null),
  
  // Server errors
  internalError: (res, message = 'Internal server error', error = null) => 
    error(res, message, 500, error),
  
  serviceUnavailable: (res, message = 'Service unavailable') => 
    error(res, message, 503),
  
  // Blockchain specific
  blockchainError: (res, message, transactionHash = null, reason = null) => 
    error(res, message, 400, null, { transactionHash, reason }),
  
  insufficientFunds: (res, required, available, currency = 'ETH') => 
    error(res, `Insufficient funds. Required: ${required} ${currency}, Available: ${available} ${currency}`, 400),
  
  // Validation
  validationError: (res, errors, message = 'Validation failed') => 
    error(res, message, 400, null, { errors })
};

module.exports = {
  success,
  error,
  paginated,
  created,
  noContent,
  responses
};