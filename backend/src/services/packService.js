const contractService = require('./contractService');
const databaseService = require('./databaseService');
const cacheService = require('./cacheService');

class PackService {
  async getPacksInfo(chainId) {
    const cacheKey = `packs:${chainId || 'all'}`;
    
    return await cacheService.getOrSet(cacheKey, async () => {
      try {
        if (chainId) {
          return await contractService.readContract('PackSale', 'getAllPacksInfo', [], chainId);
        } else {
          // Get packs from all chains
          const chains = Object.keys(contractService.providers);
          const results = {};
          
          for (const chain of chains) {
            try {
              results[chain] = await contractService.readContract(
                'PackSale', 
                'getAllPacksInfo', 
                [], 
                parseInt(chain)
              );
            } catch (error) {
              results[chain] = { error: error.message };
            }
          }
          
          return results;
        }
      } catch (error) {
        throw error;
      }
    }, 60); // Cache for 1 minute
  }

  async preparePurchase(packType, userAddress, chainId) {
    try {
      // Get pack price from blockchain
      const packInfo = await contractService.readContract(
        'PackSale',
        'getPackInfo',
        [packType],
        chainId
      );
      
      return {
        packType,
        price: ethers.formatUnits(packInfo.price, 18),
        userAddress,
        chainId,
        expiration: Date.now() + 300000 // 5 minutes
      };
    } catch (error) {
      throw error;
    }
  }

  async getUserPackHistory(address, page = 1, limit = 10) {
    return await databaseService.getUserPackPurchases(address, page, limit);
  }
}

module.exports = new PackService();