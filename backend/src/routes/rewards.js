const express = require('express');
const router = express.Router();

// Claim rewards (placeholder)
router.post('/claim', async (req, res) => {
  try {
    const { userAddress } = req.body;
    
    res.json({
      success: true,
      data: {
        message: 'Reward claim endpoint - requires wallet integration',
        userAddress,
        rewards: '100.0 UFO',
        transaction: '0x...'
      }
    });
  } catch (error) {
    console.error('Reward claim error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim rewards',
      message: error.message
    });
  }
});

module.exports = router;