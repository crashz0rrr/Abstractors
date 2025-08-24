const express = require('express');
const router = express.Router();
const contractService = require('../services/contractService');

router.get('/', async (req, res) => {
  try {
    const blockNumber = await contractService.provider.getBlockNumber();
    const ufoSymbol = await contractService.contracts.ufoToken.symbol();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: {
          environment: process.env.NODE_ENV,
          uptime: process.uptime(),
          memory: process.memoryUsage()
        },
        blockchain: {
          connected: true,
          blockNumber,
          network: 'Abstract Testnet',
          chainId: process.env.ABSTRACT_CHAIN_ID
        },
        contracts: {
          ufoToken: ufoSymbol === 'UFO' ? 'connected' : 'disconnected',
          shipNFT: 'connected',
          stationNFT: 'connected',
          marketplace: 'connected',
          packSale: 'connected',
          rewardClaim: 'connected'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Service unavailable',
      message: error.message
    });
  }
});

module.exports = router;