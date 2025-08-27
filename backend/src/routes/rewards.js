const express = require('express');
const router = express.Router();
const rewardService = require('../services/rewardService');
const { validateRequest, schemas } = require('../middlewares/validation');
const { authenticateToken } = require('../middlewares/auth');
const { success, responses } = require('../utils/response');
const { catchAsync } = require('../utils/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

// Get claim proof for pending rewards
router.post('/claim/proof',
  authenticateToken,
  validateRequest(schemas.rewardClaim),
  catchAsync(async (req, res) => {
    const { chainId } = req.body;
    
    const claimData = await rewardService.generateClaimProof(req.user.address, chainId);
    success(res, 'Claim proof generated', claimData);
  })
);

// Verify claim proof before submission
router.post('/claim/verify',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { claimData } = req.body;
    
    const verification = await rewardService.verifyClaimProof(claimData);
    success(res, 'Claim verification completed', verification);
  })
);

// Get user's pending rewards
router.get('/pending',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { chainId } = req.query;
    
    const rewards = await rewardService.calculatePendingRewards(req.user.address, chainId);
    success(res, 'Pending rewards calculated', { rewards });
  })
);

// Get user's reward claim history
router.get('/history',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    const { chainId } = req.query;
    
    const history = await rewardService.getUserRewardHistory(req.user.address, chainId, page, limit);
    success(res, 'Reward history retrieved', history);
  })
);

// Get global reward statistics
router.get('/stats/global',
  catchAsync(async (req, res) => {
    const { chainId } = req.query;
    
    const stats = await rewardService.getGlobalRewardStats(chainId);
    success(res, 'Global reward stats retrieved', stats);
  })
);

// Get user's reward statistics
router.get('/stats/user/:address?',
  catchAsync(async (req, res) => {
    const address = req.params.address || req.user?.address;
    const { chainId } = req.query;
    
    if (!address) {
      return responses.badRequest(res, 'Address is required');
    }
    
    const stats = await rewardService.getUserRewardStats(address, chainId);
    success(res, 'User reward stats retrieved', stats);
  })
);

// Admin endpoint: Manual reward calculation trigger
router.post('/admin/calculate',
  authenticateToken,
  // Add admin authorization middleware here
  catchAsync(async (req, res) => {
    const result = await rewardService.calculateAllRewards();
    success(res, 'Reward calculation completed', result);
  })
);

// Get reward distribution for the current epoch
router.get('/distribution/current',
  catchAsync(async (req, res) => {
    const { chainId } = req.query;
    
    const distribution = await rewardService.getCurrentDistribution(chainId);
    success(res, 'Current reward distribution', distribution);
  })
);

module.exports = router;