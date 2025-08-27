const userService = require('../services/userService');
const response = require('../utils/responses');

const getUser = async (req, res, next) => {
  try {
    const { address } = req.params;
    const userData = await userService.getUserOverview(address);
    response.success(res, 'User data retrieved', userData);
  } catch (error) {
    next(error);
  }
};

const getUserFleet = async (req, res, next) => {
  try {
    const { address } = req.params;
    const fleetData = await userService.getUserFleetDetails(address);
    response.success(res, 'Fleet data retrieved', fleetData);
  } catch (error) {
    next(error);
  }
};

// Gets a user's current unclaimed rewards (calculated off-chain)
const getUserRewards = async (req, res, next) => {
  try {
    const { address } = req.params;
    const rewardData = await userService.calculatePendingRewards(address);
    response.success(res, 'Rewards calculated', rewardData);
  } catch (error) {
    next(error);
  }
};

module.exports = { getUser, getUserFleet, getUserRewards };