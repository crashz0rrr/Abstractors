const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = getRedisClient();
    this.defaultTTL = 300; // 5 minutes
  }

  async get(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.client.set(key, JSON.stringify(value), {
        EX: ttl
      });
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    try {
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      const data = await fetchFn();
      await this.set(key, data, ttl);
      return data;
    } catch (error) {
      logger.error('Cache getOrSet error:', error);
      return await fetchFn();
    }
  }

  async clearPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return keys.length;
    } catch (error) {
      logger.error('Cache clear pattern error:', error);
      return 0;
    }
  }

  // Specific cache keys
  getUserKey(address) {
    return `user:${address.toLowerCase()}`;
  }

  getMarketplaceKey() {
    return 'marketplace:listings';
  }

  getPacksKey() {
    return 'packs:all';
  }

  getStatsKey() {
    return 'stats:global';
  }
}

module.exports = new CacheService();