const express = require('express');
const router = express.Router();
const { generateToken, generateAuthMessage, verifyWalletSignature } = require('../middlewares/auth');
const { validateRequest, schemas } = require('../middlewares/validation');
const databaseService = require('../services/databaseService');
const { responses, success } = require('../utils/response');
const { catchAsync } = require('../utils/errorHandler');
const { authenticateToken, optionalAuth } = require('../middlewares/auth');

// Generate authentication message for wallet signing
router.post('/message', 
  validateRequest(schemas.address),
  catchAsync(async (req, res) => {
    const { address } = req.body;
    
    const message = generateAuthMessage(address);
    
    success(res, 'Auth message generated', { 
      message,
      address,
      timestamp: Date.now()
    });
  })
);

// Verify wallet signature and generate JWT token
router.post('/verify',
  validateRequest(schemas.auth),
  verifyWalletSignature,
  catchAsync(async (req, res) => {
    const { address } = req.walletAddress;
    
    // Find or create user
    const user = await databaseService.findOrCreateUser(address);
    
    // Generate JWT token
    const token = generateToken({
      address: user.address,
      userId: user._id,
      chainId: process.env.DEFAULT_CHAIN_ID
    });

    // Update user last active
    await databaseService.updateUserLastActive(address);

    success(res, 'Authentication successful', {
      token,
      user: {
        address: user.address,
        username: user.username,
        totalFleetPower: user.totalFleetPower,
        totalRewardsClaimed: user.totalRewardsClaimed
      }
    });
  })
);

// Verify token validity
router.get('/verify',
  authenticateToken,
  catchAsync(async (req, res) => {
    success(res, 'Token is valid', {
      user: req.user,
      valid: true,
      expiresIn: '7 days'
    });
  })
);

// Get user profile (optional auth)
router.get('/profile/:address',
  optionalAuth,
  catchAsync(async (req, res) => {
    const { address } = req.params;
    
    const userStats = await databaseService.getUserStats(address);
    
    if (!userStats) {
      return responses.notFound(res, 'User not found');
    }

    success(res, 'User profile retrieved', userStats);
  })
);

module.exports = router;