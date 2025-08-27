const express = require('express');
const router = express.Router();
const statsService = require('../services/statsService');
const { success } = require('../utils/response');
const { catchAsync } = require('../utils/errorHandler');

// Get global statistics
router.get('/global',
  catchAsync(async (req, res) => {
    const { chainId } = req.query;
    
    const stats = await statsService.getGlobalStats(chainId);
    success(res, 'Global stats retrieved', stats);
  })
);

// Get mining statistics
router.get('/mining',
  catchAsync(async (req, res) => {
    const { chainId } = req.query;
    
    const stats = await statsService.getMiningStats(chainId);
    success(res, 'Mining stats retrieved', stats);
  })
);

// Get multi-chain statistics
router.get('/multichain',
  catchAsync(async (req, res) => {
    const stats = await statsService.getMultiChainStats();
    success(res, 'Multi-chain stats retrieved', stats);
  })
);

// Get marketplace statistics
router.get('/marketplace',
  catchAsync(async (req, res) => {
    const { chainId } = req.query;
    
    const stats = await statsService.getMarketplaceStats(chainId);
    success(res, 'Marketplace stats retrieved', stats);
  })
);

// Get pack statistics
router.get('/packs',
  catchAsync(async (req, res) => {
    const { chainId } = req.query;
    
    const stats = await statsService.getPackStats(chainId);
    success(res, 'Pack stats retrieved', stats);
  })
);

// Get user statistics leaderboard
router.get('/leaderboard',
  catchAsync(async (req, res) => {
    const { type = 'fleetPower', limit = 10, chainId } = req.query;
    
    const leaderboard = await statsService.getLeaderboard(type, parseInt(limit), chainId);
    success(res, 'Leaderboard retrieved', leaderboard);
  })
);

// Get historical data for charts
router.get('/historical/:metric',
  catchAsync(async (req, res) => {
    const { metric } = req.params;
    const { days = 7, chainId } = req.query;
    
    const data = await statsService.getHistoricalData(metric, parseInt(days), chainId);
    success(res, 'Historical data retrieved', data);
  })
);

// Get system health statistics
router.get('/system',
  catchAsync(async (req, res) => {
    const stats = await statsService.getSystemStats();
    success(res, 'System stats retrieved', stats);
  })
);

module.exports = router;