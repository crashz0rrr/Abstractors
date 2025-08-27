const { ethers } = require('ethers');
const logger = require('./logger');

/**
 * Ethereum address validation and normalization
 */
const isValidAddress = (address) => {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
};

const normalizeAddress = (address) => {
  try {
    return ethers.getAddress(address);
  } catch {
    return null;
  }
};

/**
 * Cryptographic functions for hybrid architecture
 */
const signMessage = async (message) => {
  try {
    const wallet = new ethers.Wallet(process.env.SERVER_WALLET_PRIVATE_KEY);
    return await wallet.signMessage(message);
  } catch (error) {
    logger.error('Error signing message:', error);
    throw error;
  }
};

const verifySignature = (message, signature) => {
  try {
    return ethers.verifyMessage(message, signature);
  } catch (error) {
    logger.error('Error verifying signature:', error);
    return null;
  }
};

const generateRewardHash = (userAddress, amount, epoch) => {
  return ethers.id(`${userAddress}:${amount}:${epoch}`);
};

/**
 * Blockchain utilities
 */
const parseUnits = (amount, decimals = 18) => {
  return ethers.parseUnits(amount.toString(), decimals);
};

const formatUnits = (value, decimals = 18) => {
  return ethers.formatUnits(value, decimals);
};

const toWei = (eth) => parseUnits(eth, 18);
const fromWei = (wei) => formatUnits(wei, 18);

/**
 * Data validation utilities
 */
const isValidNumber = (value) => {
  return !isNaN(value) && isFinite(value) && value >= 0;
};

const isValidPercentage = (value) => {
  return isValidNumber(value) && value >= 0 && value <= 100;
};

const isValidTimestamp = (timestamp) => {
  return new Date(timestamp).getTime() > 0;
};

/**
 * Pagination utilities
 */
const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

const buildPagination = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

/**
 * Cache key generators
 */
const generateCacheKey = (prefix, ...args) => {
  const keyParts = args.filter(arg => arg !== undefined && arg !== null);
  return `${prefix}:${keyParts.join(':')}`;
};

const cacheKeys = {
  user: (address) => generateCacheKey('user', address),
  userRewards: (address, chainId) => generateCacheKey('rewards', address, chainId),
  marketplace: (chainId) => generateCacheKey('marketplace', chainId),
  packs: (chainId) => generateCacheKey('packs', chainId),
  stats: (chainId) => generateCacheKey('stats', chainId),
  global: (key) => generateCacheKey('global', key)
};

/**
 * Error handling utilities
 */
const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

const timeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    )
  ]);
};

module.exports = {
  // Address utilities
  isValidAddress,
  normalizeAddress,
  
  // Cryptographic utilities
  signMessage,
  verifySignature,
  generateRewardHash,
  
  // Blockchain utilities
  parseUnits,
  formatUnits,
  toWei,
  fromWei,
  
  // Validation utilities
  isValidNumber,
  isValidPercentage,
  isValidTimestamp,
  
  // Pagination utilities
  getPaginationParams,
  buildPagination,
  
  // Cache utilities
  generateCacheKey,
  cacheKeys,
  
  // Error handling utilities
  withRetry,
  timeout
};