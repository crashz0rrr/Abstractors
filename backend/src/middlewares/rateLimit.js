const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const { response } = require('../utils/response');
const logger = require('../utils/logger');
const { getRedisClient, isRedisConnected } = require('../config/redis');

let generalLimiter, strictLimiter, authLimiter;

const initializeRateLimiters = async () => {
  try {
    if (isRedisConnected()) {
      const redisClient = getRedisClient();
      
      generalLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900,
        keyPrefix: 'rl_general'
      });

      strictLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        points: 10,
        duration: 60,
        keyPrefix: 'rl_strict'
      });

      authLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        points: 5,
        duration: 300,
        keyPrefix: 'rl_auth'
      });

      logger.info('✅ Rate limiters initialized with Redis');
    } else {
      // Fallback to memory if Redis is not available
      generalLimiter = new RateLimiterMemory({
        points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900,
      });

      strictLimiter = new RateLimiterMemory({
        points: 10,
        duration: 60,
      });

      authLimiter = new RateLimiterMemory({
        points: 5,
        duration: 300,
      });

      logger.info('✅ Rate limiters initialized with memory (Redis not available)');
    }
  } catch (error) {
    logger.error('Failed to initialize rate limiters:', error);
    // Fallback to memory rate limiters
    generalLimiter = new RateLimiterMemory({
      points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900,
    });

    strictLimiter = new RateLimiterMemory({
      points: 10,
      duration: 60,
    });

    authLimiter = new RateLimiterMemory({
      points: 5,
      duration: 300,
    });
  }
};

const rateLimit = (limiter) => async (req, res, next) => {
  try {
    // Use IP + optional user ID for more precise limiting
    const key = req.user ? `${req.user.id}_${req.ip}` : req.ip;
    await limiter.consume(key);
    next();
  } catch (rejRes) {
    logger.warn('Rate limit exceeded:', { ip: req.ip, path: req.path, userId: req.user?.id });
    
    const retryAfter = Math.ceil(rejRes.msBeforeNext / 1000) || 1;
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json(response(false, null, 'Too many requests', { retryAfter }));
  }
};

// Initialize rate limiters when this module is loaded
initializeRateLimiters().catch(console.error);

module.exports = {
  generalRateLimit: () => rateLimit(generalLimiter),
  strictRateLimit: () => rateLimit(strictLimiter),
  authRateLimit: () => rateLimit(authLimiter),
  initializeRateLimiters
};