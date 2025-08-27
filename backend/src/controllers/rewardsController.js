const rewardService = require('../services/rewardService');
const { response } = require('../utils/response');
const { validateRequest, schemas } = require('../middlewares/validation');

const getClaimProof = [
  validateRequest(schemas.rewardClaim),
  async (req, res, next) => {
    try {
      const { userAddress, chainId } = req.body;
      
      const claimData = await rewardService.generateClaimProof(userAddress, chainId);
      response.success(res, 'Claim proof generated', claimData);
    } catch (error) {
      next(error);
    }
  }
];

const verifyClaim = async (req, res, next) => {
  try {
    const { claimData } = req.body;
    
    const verification = await rewardService.verifyClaimProof(claimData);
    response.success(res, 'Claim verified', verification);
  } catch (error) {
    next(error);
  }
};

const getUserRewards = async (req, res, next) => {
  try {
    const { address } = req.params;
    const { chainId } = req.query;
    
    const rewards = await rewardService.calculatePendingRewards(address, chainId);
    response.success(res, 'Pending rewards calculated', { rewards });
  } catch (error) {
    next(error);
    }
};

// Admin endpoint to manually trigger reward calculation
const calculateRewards = async (req, res, next) => {
  try {
    const result = await rewardService.calculateAllRewards();
    response.success(res, 'Reward calculation completed', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClaimProof,
  verifyClaim,
  getUserRewards,
  calculateRewards
};