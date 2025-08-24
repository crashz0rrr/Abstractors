const express = require('express');
const router = express.Router();
const contractService = require('../services/contractService');

// Get all available packs
router.get('/', async (req, res) => {
  try {
    const packs = await contractService.getPacksInfo();
    
    res.json({
      success: true,
      data: {
        packs,
        total: packs.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Packs info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pack information',
      message: error.message
    });
  }
});

// Purchase pack (placeholder - would need wallet integration)
router.post('/purchase', async (req, res) => {
  try {
    const { packType, userAddress } = req.body;
    
    res.json({
      success: true,
      data: {
        message: 'Pack purchase endpoint - requires wallet integration',
        packType,
        userAddress,
        transaction: '0x...' // Would be actual tx hash
      }
    });
  } catch (error) {
    console.error('Pack purchase error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process pack purchase',
      message: error.message
    });
  }
});

module.exports = router;