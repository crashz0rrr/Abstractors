const { ethers } = require('ethers');
const AbstractorsTokenABI = require('../abis/AbstractorsToken.json');
const ShipNFTABI = require('../abis/ShipNFT.json');
const StationNFTABI = require('../abis/StationNFT.json');
const MarketplaceABI = require('../abis/Marketplace.json');
const PackSaleABI = require('../abis/PackSale.json');
const RewardClaimABI = require('../abis/RewardClaim.json');
const logger = require('../utils/logger');

class ContractService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.ABSTRACT_RPC_URL);
    this.contracts = {};
    this.initializeContracts();
  }

  initializeContracts() {
    try {
      this.contracts.ufoToken = new ethers.Contract(
        process.env.CONTRACT_UFO,
        AbstractorsTokenABI.abi,
        this.provider
      );

      this.contracts.shipNFT = new ethers.Contract(
        process.env.CONTRACT_SHIP_NFT,
        ShipNFTABI.abi,
        this.provider
      );

      this.contracts.stationNFT = new ethers.Contract(
        process.env.CONTRACT_STATION_NFT,
        StationNFTABI.abi,
        this.provider
      );

      this.contracts.marketplace = new ethers.Contract(
        process.env.CONTRACT_MARKETPLACE,
        MarketplaceABI.abi,
        this.provider
      );

      this.contracts.packSale = new ethers.Contract(
        process.env.CONTRACT_PACK_SALE,
        PackSaleABI.abi,
        this.provider
      );

      this.contracts.rewardClaim = new ethers.Contract(
        process.env.CONTRACT_REWARD_CLAIM,
        RewardClaimABI.abi,
        this.provider
      );

      logger.info('✅ All contracts initialized successfully');
    } catch (error) {
      logger.error('❌ Contract initialization failed:', error);
      throw error;
    }
  }

  async getFleetPower(userAddress) {
    try {
      const power = await this.contracts.rewardClaim.getFleetPower(userAddress);
      return ethers.formatUnits(power, 0);
    } catch (error) {
      logger.error('Error getting fleet power:', error);
      throw error;
    }
  }

  async getMarketplaceListings() {
    try {
      const listings = await this.contracts.marketplace.getActiveListings();
      return listings.map(listing => ({
        id: listing.id.toString(),
        seller: listing.seller,
        listingType: listing.listingType,
        tokenId: listing.tokenId.toString(),
        price: ethers.formatUnits(listing.price, 18),
        status: listing.status
      }));
    } catch (error) {
      logger.error('Error getting marketplace listings:', error);
      throw error;
    }
  }

  async getUserNFTs(userAddress) {
    try {
      const [ships, stations] = await Promise.all([
        this.contracts.shipNFT.getOwnedShips(userAddress),
        this.contracts.stationNFT.getOwnedStations(userAddress)
      ]);

      return {
        ships: ships.map(id => id.toString()),
        stations: stations.map(id => id.toString())
      };
    } catch (error) {
      logger.error('Error getting user NFTs:', error);
      throw error;
    }
  }

  async getPacksInfo() {
    try {
      const packTypes = [0, 1, 2, 3, 4, 5];
      const packs = [];

      for (const packType of packTypes) {
        const info = await this.contracts.packSale.getPackInfo(packType);
        packs.push({
          type: packType,
          name: this.getPackName(packType),
          price: ethers.formatUnits(info.price, 18),
          ufoBonus: ethers.formatUnits(info.ufoBonus, 18),
          totalSupply: info.totalSupply.toString(),
          maxSupply: info.maxSupply.toString(),
          isActive: info.isActive,
          shipRewardCount: info.shipRewardCount.toString(),
          stationRewardCount: info.stationRewardCount.toString()
        });
      }

      return packs;
    } catch (error) {
      logger.error('Error getting packs info:', error);
      throw error;
    }
  }

  getPackName(packType) {
    const names = [
      'PRESALE_BRONZE',
      'PRESALE_SILVER',
      'PRESALE_GOLD',
      'LAUNCH_BASIC',
      'LAUNCH_PREMIUM',
      'LAUNCH_ULTIMATE'
    ];
    return names[packType] || 'UNKNOWN';
  }

  async getTokenBalance(userAddress) {
    try {
      const balance = await this.contracts.ufoToken.balanceOf(userAddress);
      return ethers.formatUnits(balance, 18);
    } catch (error) {
      logger.error('Error getting token balance:', error);
      throw error;
    }
  }

  async getGlobalStats() {
    try {
      const [totalShips, totalStations, totalListings] = await Promise.all([
        this.contracts.shipNFT.totalSupply(),
        this.contracts.stationNFT.totalSupply(),
        this.contracts.marketplace.listingCount()
      ]);

      return {
        totalShips: totalShips.toString(),
        totalStations: totalStations.toString(),
        totalListings: totalListings.toString(),
        totalFleetPower: await this.contracts.rewardClaim.getTotalFleetPower()
      };
    } catch (error) {
      logger.error('Error getting global stats:', error);
      throw error;
    }
  }

  async getUserMiningStats(userAddress) {
    try {
            const stats = await this.contracts.rewardClaim.getUserMiningStats(userAddress);
            
            return {
                fleetPower: ethers.formatUnits(stats.fleetPower, 0),
                pendingRewards: ethers.formatUnits(stats.pendingRewards, 18),
                nextClaimTime: new Date(parseInt(stats.nextClaimTime.toString()) * 1000).toISOString(),
                totalEarned: ethers.formatUnits(stats.totalEarned, 18),
                canClaim: Date.now() >= parseInt(stats.nextClaimTime.toString()) * 1000
            };
        } catch (error) {
            logger.error('Error getting user mining stats:', error);
            throw error;
        }
    }

    async getGlobalMiningStats() {
        try {
                const [totalFleetPower, totalEmitted, emissionRate] = await Promise.all([
                this.contracts.rewardClaim.getTotalFleetPower(),
                this.contracts.rewardClaim.totalEmitted(),
                this.contracts.rewardClaim.baseEmissionRate()
                ]);

                return {
                    totalFleetPower: ethers.formatUnits(totalFleetPower, 0),
                    totalUfoEmitted: ethers.formatUnits(totalEmitted, 18),
                    emissionRate: ethers.formatUnits(emissionRate, 18),
                    emissionRatePerHour: ethers.formatUnits(emissionRate, 18) + ' UFO per fleet power per hour'
                };
            } catch (error) {
                logger.error('Error getting global mining stats:', error);
                throw error;
            }
    }
}

module.exports = new ContractService();