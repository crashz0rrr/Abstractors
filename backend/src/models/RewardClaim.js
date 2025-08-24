const mongoose = require('mongoose');

const rewardClaimSchema = new mongoose.Schema({
  userAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  amount: {
    type: Number,
    required: true
  },
  fleetPower: {
    type: Number,
    required: true
  },
  totalFleetPower: {
    type: Number,
    required: true
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
  claimedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
rewardClaimSchema.index({ userAddress: 1 });
rewardClaimSchema.index({ claimedAt: -1 });
rewardClaimSchema.index({ status: 1 });

module.exports = mongoose.model('RewardClaim', rewardClaimSchema);