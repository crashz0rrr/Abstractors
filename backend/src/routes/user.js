const express = require('express');
const router = express.Router();
const contractService = require('../services/contractService');
const validationService = require('../services/validationService');

// Get user profile
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!validationService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const [nfts, fleetPower, tokenBalance] = await Promise.all([
      contractService.getUserNFTs(address),
      contractService.getFleetPower(address),
      contractService.getTokenBalance(address)
    ]);

    res.json({
      success: true,
      data: {
        address,
        nfts,
        fleetPower,
        tokenBalance,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user data',
      message: error.message
    });
  }
});

// Get user's fleet details
router.get('/:address/fleet', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!validationService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const fleetPower = await contractService.getFleetPower(address);
    
    res.json({
      success: true,
      data: {
        address,
        fleetPower,
        calculationTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Fleet power error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate fleet power',
      message: error.message
    });
  }
});

module.exports = router;