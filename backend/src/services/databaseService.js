const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Listing = require('../models/Listing');
const PackPurchase = require('../models/PackPurchase');
const RewardClaim = require('../models/RewardClaim');
const logger = require('../utils/logger');

class DatabaseService {
  // User methods
  async findOrCreateUser(address) {
    try {
      return await User.findOrCreate(address);
    } catch (error) {
      logger.error('Error finding/creating user:', error);
      throw error;
    }
  }

  async updateUserFleetPower(address, fleetPower) {
    try {
      return await User.updateFleetPower(address, fleetPower);
    } catch (error) {
      logger.error('Error updating user fleet power:', error);
      throw error;
    }
  }

  async getUserStats(address) {
    try {
      const user = await User.findOne({ address: address.toLowerCase() });
      if (!user) return null;

      const [transactions, packPurchases, rewardClaims] = await Promise.all([
        Transaction.countDocuments({ userAddress: address.toLowerCase() }),
        PackPurchase.countDocuments({ userAddress: address.toLowerCase(), status: 'SUCCESS' }),
        RewardClaim.countDocuments({ userAddress: address.toLowerCase(), status: 'SUCCESS' })
      ]);

      return {
        user,
        transactions,
        packPurchases,
        rewardClaims
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Transaction methods
  async createTransaction(transactionData) {
    try {
      return await Transaction.create(transactionData);
    } catch (error) {
      logger.error('Error creating transaction:', error);
      throw error;
    }
  }

  async updateTransactionStatus(txHash, status) {
    try {
      return await Transaction.findOneAndUpdate(
        { txHash },
        { status, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      logger.error('Error updating transaction status:', error);
      throw error;
    }
  }

  // Listing methods
  async syncListings(listings) {
    try {
      const operations = listings.map(listing => ({
        updateOne: {
          filter: { listingId: listing.id },
          update: { $set: listing },
          upsert: true
        }
      }));

      if (operations.length > 0) {
        await Listing.bulkWrite(operations);
      }
    } catch (error) {
      logger.error('Error syncing listings:', error);
      throw error;
    }
  }

  async getActiveListings(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      const query = { status: 'ACTIVE', ...filters };

      const [listings, total] = await Promise.all([
        Listing.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Listing.countDocuments(query)
      ]);

      return {
        listings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting active listings:', error);
      throw error;
    }
  }

  // Pack purchase methods
  async createPackPurchase(purchaseData) {
    try {
      return await PackPurchase.create(purchaseData);
    } catch (error) {
      logger.error('Error creating pack purchase:', error);
      throw error;
    }
  }

  async getUserPackPurchases(address, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [purchases, total] = await Promise.all([
        PackPurchase.find({ userAddress: address.toLowerCase() })
          .sort({ purchasedAt: -1 })
          .skip(skip)
          .limit(limit),
        PackPurchase.countDocuments({ userAddress: address.toLowerCase() })
      ]);

      return {
        purchases,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting user pack purchases:', error);
      throw error;
    }
  }

  // Reward claim methods
  async createRewardClaim(claimData) {
    try {
      return await RewardClaim.create(claimData);
    } catch (error) {
      logger.error('Error creating reward claim:', error);
      throw error;
    }
  }

  async getUserRewardHistory(address, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [claims, total] = await Promise.all([
        RewardClaim.find({ userAddress: address.toLowerCase() })
          .sort({ claimedAt: -1 })
          .skip(skip)
          .limit(limit),
        RewardClaim.countDocuments({ userAddress: address.toLowerCase() })
      ]);

      return {
        claims,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting user reward history:', error);
      throw error;
    }
  }

  // Stats methods
  async getGlobalStats() {
    try {
      const [
        totalUsers,
        totalTransactions,
        totalListings,
        totalPackPurchases,
        totalRewardClaims,
        totalFleetPower
      ] = await Promise.all([
        User.countDocuments(),
        Transaction.countDocuments({ status: 'SUCCESS' }),
        Listing.countDocuments({ status: 'ACTIVE' }),
        PackPurchase.countDocuments({ status: 'SUCCESS' }),
        RewardClaim.countDocuments({ status: 'SUCCESS' }),
        User.aggregate([{ $group: { _id: null, total: { $sum: '$totalFleetPower' } } }])
      ]);

      return {
        totalUsers,
        totalTransactions,
        activeListings: totalListings,
        totalPackPurchases,
        totalRewardClaims,
        totalFleetPower: totalFleetPower[0]?.total || 0
      };
    } catch (error) {
      logger.error('Error getting global stats:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseService();