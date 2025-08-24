const express = require('express');
const router = express.Router();
const { generateToken } = require('../middlewares/auth');
const { validateRequest, schemas } = require('../middlewares/validation');
const databaseService = require('../services/databaseService');
const { response } = require('../utils/response');

// Generate auth token for address
router.post('/token', validateRequest(schemas.address), async (req, res) => {
  try {
    const { address } = req.body;
    
    // Find or create user
    const user = await databaseService.findOrCreateUser(address);
    
    // Generate token
    const token = generateToken({
      address: user.address,
      userId: user._id
    });

    res.json(response(true, {
      token,
      user: {
        address: user.address,
        username: user.username,
        totalFleetPower: user.totalFleetPower
      }
    }, 'Auth token generated successfully'));
  } catch (error) {
    console.error('Auth token error:', error);
    res.status(500).json(response(false, null, 'Failed to generate auth token'));
  }
});

// Verify token
router.get('/verify', (req, res) => {
  // This route is protected by auth middleware
  res.json(response(true, {
    user: req.user,
    valid: true
  }, 'Token is valid'));
});

module.exports = router;