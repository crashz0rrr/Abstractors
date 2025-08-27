const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { authenticateToken, optionalAuth } = require('../middlewares/auth');
const { success, responses } = require('../utils/response');
const { catchAsync } = require('../utils/errorHandler');
const { validateEthereumAddress } = require('../utils/errorHandler');

// Get user overview
router.get('/:address',
  optionalAuth,
  catchAsync(async (req, res) => {
    const { address } = req.params;
    const { chainId } = req.query;
    
    validateEthereumAddress(address, 'address');
    
    const userData = await userService.getUserOverview(address, chainId);
    
    if (!userData) {
      return responses.notFound(res, 'User not found');
    }
    
    success(res, 'User data retrieved', userData);
  })
);

// Get user fleet details
router.get('/:address/fleet',
  optionalAuth,
  catchAsync(async (req, res) => {
    const { address } = req.params;
    
    validateEthereumAddress(address, 'address');
    
    const fleetData = await userService.getUserFleetDetails(address);
    success(res, 'Fleet data retrieved', fleetData);
  })
);

// Get user's NFTs across all chains
router.get('/:address/nfts',
  optionalAuth,
  catchAsync(async (req, res) => {
    const { address } = req.params;
    const { chainId } = req.query;
    
    validateEthereumAddress(address, 'address');
    
    const nfts = await userService.getUserNFTs(address, chainId);
    success(res, 'User NFTs retrieved', nfts);
  })
);

// Get user's balances across all chains
router.get('/:address/balances',
  optionalAuth,
  catchAsync(async (req, res) => {
    const { address } = req.params;
    
    validateEthereumAddress(address, 'address');
    
    const balances = await userService.getUserBalances(address);
    success(res, 'User balances retrieved', balances);
  })
);

// Update user profile (authenticated)
router.put('/profile',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { username, email } = req.body;
    
    const updatedUser = await userService.updateUserProfile(req.user.address, { username, email });
    success(res, 'Profile updated successfully', updatedUser);
  })
);

// Search users
router.get('/search/:query',
  catchAsync(async (req, res) => {
    const { query } = req.params;
    const { limit = 10 } = req.query;
    
    const users = await userService.searchUsers(query, parseInt(limit));
    success(res, 'Users found', users);
  })
);

// Get user activity feed
router.get('/:address/activity',
  optionalAuth,
  catchAsync(async (req, res) => {
    const { address } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    validateEthereumAddress(address, 'address');
    
    const activity = await userService.getUserActivity(address, parseInt(page), parseInt(limit));
    success(res, 'User activity retrieved', activity);
  })
);

module.exports = router;