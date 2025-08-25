const express = require('express');
const router = express.Router();
const contractService = require('../services/contractService');
const { validateRequest, schemas } = require('../middlewares/validation');

// Get user mining stats
router.get('/mining/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const stats = await contractService.getUserMiningStats(address);
    
    res.json({
      success: true,
      data: {
        address,
        ...stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Mining stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mining stats',
      message: error.message
    });
  }
});

// Get global mining statistics
router.get('/global', async (req, res) => {
  try {
    const stats = await contractService.getGlobalMiningStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Global mining stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch global mining stats',
      message: error.message
    });
  }
});

module.exports = router;