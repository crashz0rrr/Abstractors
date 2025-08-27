const { ethers } = require('ethers');
const { getChainConfig, defaultChainId } = require('../config/chains');
const logger = require('../utils/logger');

// Import your contract ABIs
const AbstractorsTokenABI = require('../abis/AbstractorsToken.json');
const ShipNFTABI = require('../abis/ShipNFT.json');
const StationNFTABI = require('../abis/StationNFT.json');
const MarketplaceABI = require('../abis/Marketplace.json');
const PackSaleABI = require('../abis/PackSale.json');
const RewardClaimABI = require('../abis/RewardClaim.json');

class ContractService {
  constructor() {
    this.providers = {};
    this.contracts = {};
    this.abis = {
      UFO: AbstractorsTokenABI.abi,
      ShipNFT: ShipNFTABI.abi,
      StationNFT: StationNFTABI.abi,
      Marketplace: MarketplaceABI.abi,
      PackSale: PackSaleABI.abi,
      RewardClaim: RewardClaimABI.abi
    };
  }

  getProvider(chainId = defaultChainId) {
    if (!this.providers[chainId]) {
      const config = getChainConfig(chainId);
      this.providers[chainId] = new ethers.JsonRpcProvider(config.rpc);
    }
    return this.providers[chainId];
  }

  getContract(contractName, chainId = defaultChainId) {
    const cacheKey = `${chainId}_${contractName}`;
    
    if (!this.contracts[cacheKey]) {
      const config = getChainConfig(chainId);
      const provider = this.getProvider(chainId);
      const address = config.contracts[contractName];
      
      if (!address) {
        throw new Error(`Contract ${contractName} not configured for chain ${chainId}`);
      }

      this.contracts[cacheKey] = new ethers.Contract(
        address,
        this.abis[contractName],
        provider
      );
    }
    
    return this.contracts[cacheKey];
  }

  // Generic read function for any contract method
  async readContract(contractName, functionName, args = [], chainId = defaultChainId) {
    try {
      const contract = this.getContract(contractName, chainId);
      return await contract[functionName](...args);
    } catch (error) {
      logger.error(`Error reading ${contractName}.${functionName}:`, error);
      throw error;
    }
  }

  // --- Specific Methods with Chain Awareness ---

  async getFleetPower(userAddress, chainId = defaultChainId) {
    try {
      const power = await this.readContract('RewardClaim', 'getFleetPower', [userAddress], chainId);
      return ethers.formatUnits(power, 0);
    } catch (error) {
      logger.error('Error getting fleet power:', error);
      throw error;
    }
  }

  async getMarketplaceListings(chainId = defaultChainId) {
    try {
      const listings = await this.readContract('Marketplace', 'getActiveListings', [], chainId);
      return listings.map(listing => ({
        id: listing.id.toString(),
        seller: listing.seller,
        listingType: listing.listingType,
        tokenId: listing.tokenId.toString(),
        price: ethers.formatUnits(listing.price, 18),
        status: listing.status,
        chainId // Include chain ID for frontend
      }));
    } catch (error) {
      logger.error('Error getting marketplace listings:', error);
      throw error;
    }
  }

  async getUserNFTs(userAddress, chainId = defaultChainId) {
    try {
      const [ships, stations] = await Promise.all([
        this.readContract('ShipNFT', 'getOwnedShips', [userAddress], chainId),
        this.readContract('StationNFT', 'getOwnedStations', [userAddress], chainId)
      ]);

      return {
        ships: ships.map(id => id.toString()),
        stations: stations.map(id => id.toString()),
        chainId
      };
    } catch (error) {
      logger.error('Error getting user NFTs:', error);
      throw error;
    }
  }

  async getTokenBalance(userAddress, chainId = defaultChainId) {
    try {
      const balance = await this.readContract('UFO', 'balanceOf', [userAddress], chainId);
      return ethers.formatUnits(balance, 18);
    } catch (error) {
      logger.error('Error getting token balance:', error);
      throw error;
    }
  }

  async getGlobalStats(chainId = defaultChainId) {
    try {
      const [totalShips, totalStations, totalListings, totalFleetPower] = await Promise.all([
        this.readContract('ShipNFT', 'totalSupply', [], chainId),
        this.readContract('StationNFT', 'totalSupply', [], chainId),
        this.readContract('Marketplace', 'listingCount', [], chainId),
        this.readContract('RewardClaim', 'getTotalFleetPower', [], chainId)
      ]);

      return {
        totalShips: totalShips.toString(),
        totalStations: totalStations.toString(),
        totalListings: totalListings.toString(),
        totalFleetPower: ethers.formatUnits(totalFleetPower, 0),
        chainId
      };
    } catch (error) {
      logger.error('Error getting global stats:', error);
      throw error;
    }
  }

  // Add methods for other chains
  async getMultiChainBalances(userAddress) {
    const balances = {};
    
    for (const chainId of Object.keys(this.providers)) {
      try {
        balances[chainId] = await this.getTokenBalance(userAddress, parseInt(chainId));
      } catch (error) {
        logger.warn(`Could not get balance for chain ${chainId}:`, error.message);
        balances[chainId] = '0';
      }
    }
    
    return balances;
  }
}

module.exports = new ContractService();