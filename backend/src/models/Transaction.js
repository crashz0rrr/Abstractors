const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['PACK_PURCHASE', 'MARKETPLACE_BUY', 'MARKETPLACE_SELL', 'REWARD_CLAIM'],
    required: true
  },
  userAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'UFO'
  },
  txHash: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'PENDING'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  blockNumber: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ userAddress: 1, type: 1 });
transactionSchema.index({ txHash: 1 });
transactionSchema.index({ timestamp: -1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);