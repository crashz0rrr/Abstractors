const express = require('express');
const router = express.Router();
const marketplaceService = require('../services/marketplaceService');
const { validateRequest, schemas } = require('../middlewares/validation');
const { authenticateToken } = require('../middlewares/auth');
const { success, responses } = require('../utils/response');
const { catchAsync } = require('../utils/errorHandler');
const { getPaginationParams } = require('../utils/helpers');

// Get active marketplace listings
router.get('/listings',
  catchAsync(async (req, res) => {
    const { chainId } = req.query;
    const { page, limit } = getPaginationParams(req.query);
    const filters = {
      status: 'ACTIVE',
      ...(req.query.type && { listingType: req.query.type }),
      ...(req.query.minPrice && { price: { $gte: parseFloat(req.query.minPrice) } }),
      ...(req.query.maxPrice && { price: { ...(req.query.minPrice ? { $gte: parseFloat(req.query.minPrice) } : {}), $lte: parseFloat(req.query.maxPrice) } })
    };
    
    const listings = await marketplaceService.getActiveListings(chainId, page, limit, filters);
    success(res, 'Listings retrieved successfully', listings);
  })
);

// Get specific listing details
router.get('/listings/:listingId',
  catchAsync(async (req, res) => {
    const { listingId } = req.params;
    const { chainId } = req.query;
    
    const listing = await marketplaceService.getListingDetails(listingId, chainId);
    
    if (!listing) {
      return responses.notFound(res, 'Listing not found');
    }
    
    success(res, 'Listing details retrieved', listing);
  })
);

// Get NFT metadata
router.get('/metadata/:chainId/:contractAddress/:tokenId',
  catchAsync(async (req, res) => {
    const { chainId, contractAddress, tokenId } = req.params;
    
    const metadata = await marketplaceService.getNftMetadata(chainId, contractAddress, tokenId);
    
    if (!metadata) {
      return responses.notFound(res, 'Metadata not found');
    }
    
    success(res, 'NFT metadata retrieved', metadata);
  })
);

// Create new listing (authenticated)
router.post('/listings',
  authenticateToken,
  validateRequest(schemas.marketplaceListing),
  catchAsync(async (req, res) => {
    const listingData = {
      ...req.body,
      seller: req.user.address
    };
    
    const listing = await marketplaceService.createListing(listingData);
    success(res, 'Listing created successfully', listing, 201);
  })
);

// Cancel listing (authenticated)
router.delete('/listings/:listingId',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { listingId } = req.params;
    
    const result = await marketplaceService.cancelListing(listingId, req.user.address);
    
    if (!result) {
      return responses.notFound(res, 'Listing not found or not authorized');
    }
    
    success(res, 'Listing cancelled successfully');
  })
);

// Get user's listings
router.get('/user/listings',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { page, limit } = getPaginationParams(req.query);
    const filters = { seller: req.user.address };
    
    const listings = await marketplaceService.getUserListings(req.user.address, page, limit, filters);
    success(res, 'User listings retrieved', listings);
  })
);

// Get marketplace stats
router.get('/stats',
  catchAsync(async (req, res) => {
    const { chainId } = req.query;
    
    const stats = await marketplaceService.getMarketplaceStats(chainId);
    success(res, 'Marketplace stats retrieved', stats);
  })
);

module.exports = router;