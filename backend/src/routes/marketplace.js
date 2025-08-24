const express = require('express');
const router = express.Router();
const contractService = require('../services/contractService');

// Get all active listings
router.get('/listings', async (req, res) => {
  try {
    const listings = await contractService.getMarketplaceListings();
    
    res.json({
      success: true,
      data: {
        listings,
        total: listings.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Marketplace listings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketplace listings',
      message: error.message
    });
  }
});

// Get specific listing
router.get('/listing/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Implementation for specific listing
    res.json({
      success: true,
      data: {
        id,
        message: 'Single listing endpoint - to be implemented'
      }
    });
  } catch (error) {
    console.error('Single listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch listing',
      message: error.message
    });
  }
});

module.exports = router;