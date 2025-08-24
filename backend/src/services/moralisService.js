const { Moralis } = require('moralis');
const logger = require('../utils/logger');

class MoralisService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
      this.initialized = true;
      logger.info('✅ Moralis service initialized');
    } catch (error) {
      logger.warn('⚠️ Moralis initialization failed:', error.message);
    }
  }

  async getNFTs(address) {
    if (!this.initialized) {
      throw new Error('Moralis not initialized');
    }

    try {
      const response = await Moralis.EvmApi.nft.getWalletNFTs({
        address,
        chain: "0x2B6C", // Abstract Testnet chain ID in hex
      });

      return response.result;
    } catch (error) {
      logger.error('Moralis getNFTs error:', error);
      throw error;
    }
  }

  async getTokenBalances(address) {
    if (!this.initialized) {
      throw new Error('Moralis not initialized');
    }

    try {
      const response = await Moralis.EvmApi.token.getWalletTokenBalances({
        address,
        chain: "0x2B6C",
      });

      return response.result;
    } catch (error) {
      logger.error('Moralis getTokenBalances error:', error);
      throw error;
    }
  }

  async getTransactionHistory(address, limit = 10) {
    if (!this.initialized) {
      throw new Error('Moralis not initialized');
    }

    try {
      const response = await Moralis.EvmApi.transaction.getWalletTransactions({
        address,
        chain: "0x2B6C",
        limit,
      });

      return response.result;
    } catch (error) {
      logger.error('Moralis getTransactionHistory error:', error);
      throw error;
    }
  }
}

module.exports = new MoralisService();