const express = require('express');
const router = express.Router();
const packService = require('../services/packService');
const { validateRequest, schemas } = require('../middlewares/validation');
const { authenticateToken } = require('../middlewares/auth');
const { success, responses, created } = require('../utils/response');
const { catchAsync } = require('../utils/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

// Get available packs
router.get('/',
  catchAsync(async (req, res) => {
    const { chainId } = req.query;
    
    const packs = await packService.getPacksInfo(chainId);
    success(res, 'Packs retrieved successfully', packs);
  })
);

// Get specific pack details
router.get('/:packType',
  catchAsync(async (req, res) => {
    const { packType } = req.params;
    const { chainId } = req.query;
    
    const pack = await packService.getPackDetails(parseInt(packType), chainId);
    
    if (!pack) {
      return responses.notFound(res, 'Pack not found');
    }
    
    success(res, 'Pack details retrieved', pack);
  })
);

// Prepare pack purchase (generate purchase data)
router.post('/purchase/prepare',
  authenticateToken,
  validateRequest(schemas.packPurchase),
  catchAsync(async (req, res) => {
    const { packType, chainId } = req.body;
    
    const purchaseData = await packService.preparePurchase(
      packType,
      req.user.address,
      chainId
    );
    
    success(res, 'Purchase prepared', purchaseData);
  })
);

// Get user's pack purchase history
router.get('/user/history',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    
    const history = await packService.getUserPackHistory(req.user.address, page, limit);
    success(res, 'Pack history retrieved', history);
  })
);

// Get pack purchase by transaction hash
router.get('/purchase/:txHash',
  catchAsync(async (req, res) => {
    const { txHash } = req.params;
    
    const purchase = await packService.getPurchaseByTxHash(txHash);
    
    if (!purchase) {
      return responses.notFound(res, 'Purchase not found');
    }
    
    success(res, 'Purchase details retrieved', purchase);
  })
);

// Get pack statistics
router.get('/stats/overview',
  catchAsync(async (req, res) => {
    const { chainId } = req.query;
    
    const stats = await packService.getPackStatistics(chainId);
    success(res, 'Pack statistics retrieved', stats);
  })
);

// Admin endpoint: Create new pack type (protected)
router.post('/admin/create',
  authenticateToken,
  // Add admin authorization middleware here
  catchAsync(async (req, res) => {
    const packData = req.body;
    
    const pack = await packService.createPackType(packData);
    created(res, 'Pack type created successfully', pack);
  })
);

module.exports = router;