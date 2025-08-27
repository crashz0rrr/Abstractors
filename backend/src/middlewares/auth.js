const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const { response } = require('../utils/response');
const logger = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(response(false, null, 'Access token required'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('JWT verification failed:', err.message);
      return res.status(403).json(response(false, null, 'Invalid or expired token'));
    }
    
    req.user = user;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }

  next();
};

// Middleware to verify wallet signature for Web3 authentication
const verifyWalletSignature = async (req, res, next) => {
  try {
    const { address, signature, message } = req.body;

    if (!address || !signature || !message) {
      return res.status(400).json(response(false, null, 'Address, signature, and message are required'));
    }

    // Verify the signature
    const signerAddress = ethers.verifyMessage(message, signature);
    
    if (signerAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json(response(false, null, 'Invalid signature'));
    }

    // Check if message is recent (prevent replay attacks)
    const messageTime = parseInt(message.split('Timestamp: ')[1]);
    if (Date.now() - messageTime > 5 * 60 * 1000) { // 5 minutes
      return res.status(401).json(response(false, null, 'Signature expired'));
    }

    req.walletAddress = address;
    next();
  } catch (error) {
    logger.error('Wallet signature verification failed:', error);
    return res.status(401).json(response(false, null, 'Signature verification failed'));
  }
};

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate a message for the user to sign
const generateAuthMessage = (address) => {
  const timestamp = Date.now();
  return `Please sign this message to authenticate with SpaceGame. Timestamp: ${timestamp}`;
};

module.exports = {
  authenticateToken,
  optionalAuth,
  verifyWalletSignature,
  generateToken,
  generateAuthMessage
};