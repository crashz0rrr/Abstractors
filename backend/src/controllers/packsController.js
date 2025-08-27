const packService = require('../services/packService');
const { response } = require('../utils/response');
const { validateRequest, schemas } = require('../middlewares/validation');

const getPacks = async (req, res, next) => {
  try {
    const { chainId } = req.query;
    const packs = await packService.getPacksInfo(chainId);
    response.success(res, 'Packs retrieved', packs);
  } catch (error) {
    next(error);
  }
};

const getPackHistory = async (req, res, next) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const history = await packService.getUserPackHistory(address, parseInt(page), parseInt(limit));
    response.success(res, 'Pack history retrieved', history);
  } catch (error) {
    next(error);
  }
};

const preparePackPurchase = [
  validateRequest(schemas.packPurchase),
  async (req, res, next) => {
    try {
      const { packType, userAddress, chainId } = req.body;
      
      const purchaseData = await packService.preparePurchase(
        packType, 
        userAddress, 
        chainId
      );
      
      response.success(res, 'Purchase prepared', purchaseData);
    } catch (error) {
      next(error);
    }
  }
];

module.exports = {
  getPacks,
  getPackHistory,
  preparePackPurchase
};