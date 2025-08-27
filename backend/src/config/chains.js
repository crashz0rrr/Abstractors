const logger = require('../utils/logger');

// Multichain Configuration - Dynamically built from environment variables
const buildChainConfigs = () => {
  const configs = {};
  const chainIds = [];

  // Extract all unique chain IDs from environment variables
  for (const key in process.env) {
    if (key.startsWith('CONTRACT_') && key.includes('_UFO')) {
      const parts = key.split('_');
      const chainId = parseInt(parts[1]); // e.g., CONTRACT_11124_UFO -> 11124
      if (!isNaN(chainId) && !chainIds.includes(chainId)) {
        chainIds.push(chainId);
      }
    }
  }

  // Build config for each found chain
  chainIds.forEach(chainId => {
    const chainKey = `CHAIN_${chainId}_RPC`;
    const rpcUrl = process.env[chainKey] || process.env[`${chainId}_RPC_URL`];

    if (!rpcUrl) {
      logger.warn(`RPC URL not found for chain ${chainId}. Skipping.`);
      return;
    }

    configs[chainId] = {
      name: process.env[`CHAIN_${chainId}_NAME`] || `Chain ${chainId}`,
      rpc: rpcUrl,
      contracts: {
        UFO: process.env[`CONTRACT_${chainId}_UFO`],
        ShipNFT: process.env[`CONTRACT_${chainId}_SHIP_NFT`],
        StationNFT: process.env[`CONTRACT_${chainId}_STATION_NFT`],
        Marketplace: process.env[`CONTRACT_${chainId}_MARKETPLACE`],
        PackSale: process.env[`CONTRACT_${chainId}_PACK_SALE`],
        RewardClaim: process.env[`CONTRACT_${chainId}_REWARD_CLAIM`],
      }
    };

    // Validate that essential contracts are configured
    if (!configs[chainId].contracts.UFO) {
      logger.warn(`UFO contract not configured for chain ${chainId}. This chain may not function correctly.`);
    }
  });

  return configs;
};

const chainConfigs = buildChainConfigs();
const defaultChainId = parseInt(process.env.DEFAULT_CHAIN_ID) || 11124;

// Helper function to get config for a specific chain
const getChainConfig = (chainId = defaultChainId) => {
  const config = chainConfigs[chainId];
  if (!config) {
    throw new Error(`Configuration not found for chain ID: ${chainId}`);
  }
  return config;
};

// Helper to get a specific contract address
const getContractAddress = (contractName, chainId = defaultChainId) => {
  const config = getChainConfig(chainId);
  const address = config.contracts[contractName];
  if (!address) {
    throw new Error(`Contract ${contractName} not configured for chain ${chainId}`);
  }
  return address;
};

module.exports = {
  chainConfigs,
  defaultChainId,
  getChainConfig,
  getContractAddress
};