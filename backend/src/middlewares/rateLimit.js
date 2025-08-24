const { RateLimiterMemory } = require('rate-limiter-flexible');
const { response } = require('../utils/response');
const logger = require('../utils/logger');

// General rate limiter
const generalLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900,
});

// Strict rate limiter for sensitive endpoints
const strictLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60, // 1 minute
});

// Auth rate limiter
const authLimiter = new RateLimiterMemory({
  points: 5,
  duration: 300, // 5 minutes
});

const rateLimit = (limiter) => async (req, res, next) => {
  try {
    const key = req.ip || req.connection.remoteAddress;
    await limiter.consume(key);
    next();
  } catch (rejRes) {
    logger.warn('Rate limit exceeded:', { ip: req.ip, path: req.path });
    res.status(429).json(response(false, null, 'Too many requests'));
  }
};

module.exports = {
  generalRateLimit: rateLimit(generalLimiter),
  strictRateLimit: rateLimit(strictLimiter),
  authRateLimit: rateLimit(authLimiter),
};