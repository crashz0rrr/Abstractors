const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  listingId: {
    type: Number,
    required: true,
    unique: true
  },
  seller: {
    type: String,
    required: true,
    lowercase: true
  },
  listingType: {
    type: String,
    enum: ['SHIP', 'STATION'],
    required: true
  },
  tokenId: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'SOLD', 'CANCELLED'],
    default: 'ACTIVE'
  },
  nftMetadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
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
listingSchema.index({ seller: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ listingType: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Listing', listingSchema);