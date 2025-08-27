const redis = require('redis');
const logger = require('../utils/logger');

let redisClient;
let isConnected = false;

const connectRedis = async () => {
  try {
    if (isConnected && redisClient) {
      return redisClient;
    }

    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 60000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Too many retries on Redis connection. Exiting...');
            return new Error('Too many retries');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('connect', () => {
      logger.info('🔌 Connecting to Redis...');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      logger.info('✅ Redis Connected and Ready');
    });

    redisClient.on('error', (err) => {
      logger.error('❌ Redis connection error:', err.message);
      isConnected = false;
    });

    redisClient.on('end', () => {
      logger.warn('Redis connection closed');
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      logger.info('🔄 Redis reconnecting...');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('❌ Redis connection failed:', error.message);
    // Don't exit process for Redis failures - app can work without cache
    return null;
  }
};

const getRedisClient = () => {
  if (!redisClient || !isConnected) {
    throw new Error('Redis client not initialized or not connected');
  }
  return redisClient;
};

const isRedisConnected = () => isConnected;

module.exports = { connectRedis, getRedisClient, isRedisConnected };