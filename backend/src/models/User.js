const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  totalFleetPower: {
    type: Number,
    default: 0
  },
  totalRewardsClaimed: {
    type: Number,
    default: 0
  },
  totalPacksPurchased: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ address: 1 });
userSchema.index({ totalFleetPower: -1 });
userSchema.index({ createdAt: -1 });

// Static methods
userSchema.statics.findOrCreate = async function(address) {
  let user = await this.findOne({ address: address.toLowerCase() });
  if (!user) {
    user = await this.create({ address: address.toLowerCase() });
  }
  return user;
};

userSchema.statics.updateFleetPower = async function(address, fleetPower) {
  return this.findOneAndUpdate(
    { address: address.toLowerCase() },
    { 
      totalFleetPower: fleetPower,
      lastActive: new Date()
    },
    { new: true, upsert: true }
  );
};

module.exports = mongoose.model('User', userSchema);