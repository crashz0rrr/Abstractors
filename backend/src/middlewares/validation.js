const Joi = require('joi');
const { response } = require('../utils/response');
const { isValidAddress } = require('../utils/helpers');

const validateRequest = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { 
    abortEarly: false,
    allowUnknown: true, // Allow unknown fields but strip them
    stripUnknown: true 
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/"/g, '') // Remove quotes from error messages
    }));

    return res.status(400).json(response(false, null, 'Validation failed', { errors }));
  }

  req.body = value;
  next();
};

// Custom validation for Ethereum addresses
const ethereumAddressValidation = (value, helpers) => {
  if (!isValidAddress(value)) {
    return helpers.error('any.invalid');
  }
  return value.toLowerCase(); // Normalize to lowercase
};

// Schemas
const addressSchema = Joi.object({
  address: Joi.string().custom(ethereumAddressValidation, 'Ethereum address validation').required()
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('createdAt', 'price', 'name').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

const packPurchaseSchema = Joi.object({
  packType: Joi.number().integer().min(0).max(5).required(),
  userAddress: Joi.string().custom(ethereumAddressValidation, 'Ethereum address validation').required(),
  chainId: Joi.number().integer().positive().default(11124)
});

const rewardClaimSchema = Joi.object({
  userAddress: Joi.string().custom(ethereumAddressValidation, 'Ethereum address validation').required(),
  chainId: Joi.number().integer().positive().default(11124)
});

const authSchema = Joi.object({
  address: Joi.string().custom(ethereumAddressValidation, 'Ethereum address validation').required(),
  signature: Joi.string().pattern(/^0x[a-fA-F0-9]{130}$/).required(),
  message: Joi.string().required()
});

const marketplaceListingSchema = Joi.object({
  tokenId: Joi.number().integer().min(0).required(),
  price: Joi.number().positive().required(),
  currency: Joi.string().valid('UFO', 'ETH').default('UFO'),
  chainId: Joi.number().integer().positive().default(11124)
});

module.exports = {
  validateRequest,
  schemas: {
    address: addressSchema,
    pagination: paginationSchema,
    packPurchase: packPurchaseSchema,
    rewardClaim: rewardClaimSchema,
    auth: authSchema,
    marketplaceListing: marketplaceListingSchema
  }
};