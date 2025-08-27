const contractService = require('./contractService');
const databaseService = require('./databaseService');
const cacheService = require('./cacheService');
const { signMessage, generateRewardHash } = require('../utils/helpers');
const logger = require('../utils/logger');

class RewardService {
  constructor() {
    this.serverWallet = new ethers.Wallet(process.env.SERVER_WALLET_PRIVATE_KEY);
  }

  // HYBRID ARCHITECTURE: Off-chain calculation with on-chain verification
  async generateClaimProof(userAddress, chainId) {
    try {
      // 1. Calculate pending rewards OFF-CHAIN
      const pendingRewards = await this.calculatePendingRewards(userAddress, chainId);
      
      // 2. Get current epoch (1 hour window)
      const epoch = Math.floor(Date.now() / 1000 / 3600);
      
      // 3. Create unique message hash to prevent replay attacks
      const messageHash = generateRewardHash(userAddress, pendingRewards, epoch);
      
      // 4. Sign with server wallet (on-chain contract will verify this signature)
      const signature = await signMessage(messageHash);
      
      // 5. Return data for user to submit on-chain
      return {
        userAddress,
        amount: pendingRewards.toString(),
        epoch,
        proof: signature,
        chainId
      };
    } catch (error) {
      logger.error('Error generating claim proof:', error);
      throw error;
    }
  }

  async calculatePendingRewards(userAddress, chainId) {
    const cacheKey = `rewards:${chainId}:${userAddress}`;
    
    // Check cache first
    const cached = await cacheService.get(cacheKey);
    if (cached !== null) return cached;

    try {
      // Get user's fleet power from blockchain
      const fleetPower = await contractService.getFleetPower(userAddress, chainId);
      
      // Get global stats from our off-chain database (updated by cron)
      const globalStats = await databaseService.getGlobalMiningStats(chainId);
      
      if (!globalStats || globalStats.totalFleetPower === 0) {
        return '0';
      }

      // Calculate user's share of rewards
      const userShare = parseFloat(fleetPower) / parseFloat(globalStats.totalFleetPower);
      const pendingRewards = userShare * parseFloat(globalStats.hourlyEmission);
      
      // Cache for 5 minutes
      await cacheService.set(cacheKey, pendingRewards.toString(), 300);
      
      return pendingRewards.toString();
    } catch (error) {
      logger.error('Error calculating pending rewards:', error);
      return '0';
    }
  }

  // CRON JOB: Update off-chain global stats hourly
  async calculateAllRewards() {
    logger.info('⏰ Starting hourly reward calculation...');
    
    try {
      const chains = Object.keys(contractService.providers);
      const results = {};
      
      for (const chainId of chains) {
        try {
          // Get total fleet power from blockchain
          const totalFleetPower = await contractService.readContract(
            'RewardClaim', 
            'getTotalFleetPower', 
            [], 
            parseInt(chainId)
          );
          
          // Get emission rate from blockchain
          const emissionRate = await contractService.readContract(
            'RewardClaim',
            'baseEmissionRate',
            [],
            parseInt(chainId)
          );
          
          // Calculate hourly emission
          const hourlyEmission = ethers.formatUnits(emissionRate, 18) * ethers.formatUnits(totalFleetPower, 0);
          
          // Update off-chain database
          await databaseService.updateGlobalMiningStats(
            parseInt(chainId),
            ethers.formatUnits(totalFleetPower, 0),
            hourlyEmission.toString()
          );
          
          results[chainId] = {
            totalFleetPower: ethers.formatUnits(totalFleetPower, 0),
            hourlyEmission,
            timestamp: new Date().toISOString()
          };
          
          logger.info(`✅ Chain ${chainId}: Updated global stats`);
        } catch (error) {
          logger.error(`❌ Error updating chain ${chainId}:`, error.message);
          results[chainId] = { error: error.message };
        }
      }
      
      // Clear reward caches since global stats changed
      await cacheService.clearPattern('rewards:*');
      
      logger.info('✅ Hourly reward calculation completed');
      return results;
    } catch (error) {
      logger.error('❌ Hourly reward calculation failed:', error);
      throw error;
    }
  }

  // Verify a reward claim before submitting to blockchain
  async verifyClaimProof(claimData) {
    try {
      const { userAddress, amount, epoch, proof, chainId } = claimData;
      
      // Recreate the message hash
      const messageHash = generateRewardHash(userAddress, amount, epoch);
      
      // Verify the signature
      const signerAddress = ethers.verifyMessage(messageHash, proof);
      
      // Check if signed by our server wallet
      if (signerAddress.toLowerCase() !== this.serverWallet.address.toLowerCase()) {
        return { valid: false, reason: 'Invalid signature' };
      }
      
      // Check if epoch is not too old (within 24 hours)
      const currentEpoch = Math.floor(Date.now() / 1000 / 3600);
      if (currentEpoch - epoch > 24) {
        return { valid: false, reason: 'Claim expired' };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, reason: 'Verification failed' };
    }
  }
}

module.exports = new RewardService();