const contractService = require('./contractService');
const databaseService = require('./databaseService');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');

class UserService {
  async getUserOverview(address, chainId) {
    const cacheKey = `user:${chainId}:${address}`;
    
    return await cacheService.getOrSet(cacheKey, async () => {
      try {
        // Get data from multiple chains if no specific chain requested
        const chains = chainId ? [chainId] : Object.keys(contractService.providers);
        const results = {};
        
        for (const chain of chains) {
          try {
            const [nfts, ufoBalance, fleetPower] = await Promise.all([
              contractService.getUserNFTs(address, parseInt(chain)),
              contractService.getTokenBalance(address, parseInt(chain)),
              contractService.getFleetPower(address, parseInt(chain))
            ]);
            
            results[chain] = {
              assets: nfts,
              balances: { UFO: ufoBalance },
              metrics: { fleetPower }
            };
          } catch (error) {
            logger.warn(`Could not get data for chain ${chain}:`, error.message);
            results[chain] = { error: error.message };
          }
        }
        
        // Get off-chain data (pending rewards calculated separately)
        const dbStats = await databaseService.getUserStats(address);
        
        return {
          address,
          chains: results,
          statistics: dbStats,
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        logger.error('Error getting user overview:', error);
        throw error;
      }
    }, 60); // Cache for 1 minute
  }

  async calculateFleetPower(ships, station) {
    // HYBRID ARCHITECTURE: Complex calculation done off-chain
    let totalPower = 0;
    
    for (const ship of ships) {
      // Base power from NFT metadata + level from contract
      const shipPower = ship.basePower * (1 + (ship.level || 0) * 0.1);
      totalPower += shipPower;
    }
    
    // Apply station boost
    const stationBoost = station ? station.boostMultiplier : 1;
    return totalPower * stationBoost;
  }

  // Get user's fleet across all chains
  async getUserFleetDetails(address) {
    const fleets = {};
    const chains = Object.keys(contractService.providers);
    
    for (const chainId of chains) {
      try {
        const nfts = await contractService.getUserNFTs(address, parseInt(chainId));
        fleets[chainId] = nfts;
      } catch (error) {
        logger.warn(`Could not get fleet for chain ${chainId}:`, error.message);
      }
    }
    
    return {
      address,
      fleets,
      totalShips: Object.values(fleets).reduce((sum, fleet) => sum + fleet.ships.length, 0),
      totalStations: Object.values(fleets).reduce((sum, fleet) => sum + fleet.stations.length, 0)
    };
  }
}

module.exports = new UserService();