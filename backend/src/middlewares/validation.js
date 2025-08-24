const Joi = require('joi');
const { response } = require('../utils/response');
const validationService = require('../services/validationService');

const validateRequest = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json(response(false, null, 'Validation failed', { errors }));
  }

  req.body = value;
  next();
};

// Schemas
const addressSchema = Joi.object({
  address: Joi.string().custom((value, helpers) => {
    if (!validationService.isValidAddress(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'Ethereum address validation').required()
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const packPurchaseSchema = Joi.object({
  packType: Joi.number().integer().min(0).max(5).required(),
  userAddress: Joi.string().custom((value, helpers) => {
    if (!validationService.isValidAddress(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'Ethereum address validation').required()
});

const rewardClaimSchema = Joi.object({
  userAddress: Joi.string().custom((value, helpers) => {
    if (!validationService.isValidAddress(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'Ethereum address validation').required()
});

module.exports = {
  validateRequest,
  schemas: {
    address: addressSchema,
    pagination: paginationSchema,
    packPurchase: packPurchaseSchema,
    rewardClaim: rewardClaimSchema
  }
};