const express = require('express');
const router = express.Router();
const contractService = require('../services/contractService');

// Get global statistics
router.get('/global', async (req, res) => {
  try {
    const stats = await contractService.getGlobalStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString(),
        network: 'Abstract Testnet'
      }
    });
  } catch (error) {
    console.error('Global stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch global statistics',
      message: error.message
    });
  }
});

module.exports = router;