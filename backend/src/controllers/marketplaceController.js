const marketplaceService = require('../services/marketplaceService');
const response = require('../utils/responses');

const getListings = async (req, res, next) => {
  try {
    // Get chain from query param or user's session/default config
    const chainId = req.query.chainId || process.env.DEFAULT_CHAIN_ID;
    const listings = await marketplaceService.getActiveListings(chainId);
    response.success(res, 'Listings retrieved', { listings, chainId });
  } catch (error) {
    next(error);
  }
};

// Fetches metadata for an NFT (Ship/Station) from our DB or IPFS
const getNftMetadata = async (req, res, next) => {
  try {
    const { chainId, contractAddress, tokenId } = req.params;
    const metadata = await marketplaceService.getNftMetadata(chainId, contractAddress, tokenId);
    response.success(res, 'Metadata retrieved', metadata);
  } catch (error) {
    next(error);
  }
};

module.exports = { getListings, getNftMetadata };