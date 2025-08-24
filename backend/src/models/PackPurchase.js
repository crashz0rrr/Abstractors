const mongoose = require('mongoose');

const packPurchaseSchema = new mongoose.Schema({
  userAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  packType: {
    type: String,
    enum: ['PRESALE_BRONZE', 'PRESALE_SILVER', 'PRESALE_GOLD', 'LAUNCH_BASIC', 'LAUNCH_PREMIUM', 'LAUNCH_ULTIMATE'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  ufoBonus: {
    type: Number,
    default: 0
  },
  txHash: {
    type: String,
    required: true,
    unique: true
  },
  rewards: {
    ships: [{
      tokenId: Number,
      tier: Number,
      level: Number,
      basePower: Number
    }],
    stations: [{
      tokenId: Number,
      tier: Number,
      boostPercent: Number
    }]
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'PENDING'
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
packPurchaseSchema.index({ userAddress: 1, packType: 1 });
packPurchaseSchema.index({ txHash: 1 });
packPurchaseSchema.index({ purchasedAt: -1 });

module.exports = mongoose.model('PackPurchase', packPurchaseSchema);