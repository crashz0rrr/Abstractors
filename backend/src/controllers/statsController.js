const statsService = require('../services/statsService');
const contractService = require('../services/contractService');
const { response } = require('../utils/response');

const getGlobalStats = async (req, res, next) => {
  try {
    const { chainId } = req.query;
    const stats = await statsService.getGlobalStats(chainId);
    response.success(res, 'Global stats retrieved', stats);
  } catch (error) {
    next(error);
  }
};

const getMiningStats = async (req, res, next) => {
  try {
    const { chainId } = req.query;
    const stats = await statsService.getMiningStats(chainId);
    response.success(res, 'Mining stats retrieved', stats);
  } catch (error) {
    next(error);
  }
};

const getChainStats = async (req, res, next) => {
  try {
    const stats = await statsService.getMultiChainStats();
    response.success(res, 'Multi-chain stats retrieved', stats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGlobalStats,
  getMiningStats,
  getChainStats
};