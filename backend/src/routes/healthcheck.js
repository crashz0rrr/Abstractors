const express = require('express');
const router = express.Router();
const contractService = require('../services/contractService');
const { getChainConfig } = require('../config/chains');
const { success, error } = require('../utils/response');
const { catchAsync } = require('../utils/errorHandler');
const mongoose = require('mongoose');
const { getRedisClient, isRedisConnected } = require('../config/redis');

router.get('/', catchAsync(async (req, res) => {
  const chains = Object.keys(contractService.providers);
  const healthChecks = {};
  
  // Check each chain
  for (const chainId of chains) {
    try {
      const provider = contractService.getProvider(parseInt(chainId));
      const blockNumber = await provider.getBlockNumber();
      const config = getChainConfig(parseInt(chainId));
      
      healthChecks[chainId] = {
        status: 'healthy',
        blockNumber,
        network: config.name,
        chainId: parseInt(chainId)
      };
    } catch (err) {
      healthChecks[chainId] = {
        status: 'unhealthy',
        error: err.message,
        chainId: parseInt(chainId)
      };
    }
  }
  
  // Check MongoDB
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  // Check Redis
  const redisStatus = isRedisConnected() ? 'connected' : 'disconnected';
  
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: {
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version
    },
    database: {
      mongodb: mongoStatus,
      redis: redisStatus
    },
    chains: healthChecks,
    contracts: {
      totalConfigured: Object.keys(contractService.contracts).length,
      chains: chains.length
    }
  };
  
  // Overall status based on critical services
  const isHealthy = mongoStatus === 'connected' && 
                   Object.values(healthChecks).some(chain => chain.status === 'healthy');
  
  healthData.status = isHealthy ? 'healthy' : 'degraded';
  
  if (isHealthy) {
    success(res, 'Service is healthy', healthData);
  } else {
    error(res, 'Service is degraded', 503, null, healthData);
  }
}));

// Deep health check with contract verification
router.get('/deep', catchAsync(async (req, res) => {
  const chains = Object.keys(contractService.providers);
  const deepChecks = {};
  
  for (const chainId of chains) {
    try {
      const provider = contractService.getProvider(parseInt(chainId));
      const blockNumber = await provider.getBlockNumber();
      const config = getChainConfig(parseInt(chainId));
      
      // Test contract connections
      const contractChecks = {};
      for (const [contractName, contract] of Object.entries(config.contracts)) {
        if (contract) {
          try {
            const contractInstance = contractService.getContract(contractName, parseInt(chainId));
            const symbol = contractName === 'UFO' ? await contractInstance.symbol() : 'N/A';
            contractChecks[contractName] = { status: 'connected', symbol };
          } catch (err) {
            contractChecks[contractName] = { status: 'disconnected', error: err.message };
          }
        }
      }
      
      deepChecks[chainId] = {
        status: 'healthy',
        blockNumber,
        network: config.name,
        contracts: contractChecks
      };
    } catch (err) {
      deepChecks[chainId] = {
        status: 'unhealthy',
        error: err.message
      };
    }
  }
  
  success(res, 'Deep health check completed', {
    timestamp: new Date().toISOString(),
    chains: deepChecks,
    database: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: isRedisConnected() ? 'connected' : 'disconnected'
    }
  });
}));

module.exports = router;