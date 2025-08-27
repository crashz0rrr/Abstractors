const contractService = require('./contractService');
const databaseService = require('./databaseService');
const cacheService = require('./cacheService');

class StatsService {
  async getGlobalStats(chainId) {
    const cacheKey = `stats:global:${chainId || 'all'}`;
    
    return await cacheService.getOrSet(cacheKey, async () => {
      try {
        if (chainId) {
          // Single chain stats
          const [onChainStats, offChainStats] = await Promise.all([
            contractService.getGlobalStats(chainId),
            databaseService.getGlobalStats()
          ]);
          
          return { ...onChainStats, ...offChainStats, chainId };
        } else {
          // Multi-chain stats
          const chains = Object.keys(contractService.providers);
          const results = {};
          let totals = {
            totalShips: 0,
            totalStations: 0,
            totalListings: 0,
            totalFleetPower: 0
          };
          
          for (const chain of chains) {
            try {
              const stats = await contractService.getGlobalStats(parseInt(chain));
              results[chain] = stats;
              
              // Aggregate totals
              totals.totalShips += parseInt(stats.totalShips);
              totals.totalStations += parseInt(stats.totalStations);
              totals.totalListings += parseInt(stats.totalListings);
              totals.totalFleetPower += parseFloat(stats.totalFleetPower);
            } catch (error) {
              results[chain] = { error: error.message };
            }
          }
          
          const offChainStats = await databaseService.getGlobalStats();
          
          return {
            chains: results,
            totals,
            offChain: offChainStats
          };
        }
      } catch (error) {
        throw error;
      }
    }, 30); // Cache for 30 seconds
  }

  async getMiningStats(chainId) {
    const cacheKey = `stats:mining:${chainId || 'all'}`;
    
    return await cacheService.getOrSet(cacheKey, async () => {
      try {
        // This would get mining-specific statistics
        // Implementation depends on your contract methods
        return { /* mining stats */ };
      } catch (error) {
        throw error;
      }
    }, 60);
  }

  async getMultiChainStats() {
    const cacheKey = 'stats:multichain';
    
    return await cacheService.getOrSet(cacheKey, async () => {
      try {
        const chains = Object.keys(contractService.providers);
        const stats = {};
        
        for (const chainId of chains) {
          try {
            stats[chainId] = await this.getGlobalStats(parseInt(chainId));
          } catch (error) {
            stats[chainId] = { error: error.message };
          }
        }
        
        return stats;
      } catch (error) {
        throw error;
      }
    }, 300); // Cache for 5 minutes
  }
}

module.exports = new StatsService();