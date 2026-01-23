const express = require('express');
const router = express.Router();
const { getNearbyVendors } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware'); // User login hona chahiye

// Route: POST /api/user/nearby-vendors
router.post('/nearby-vendors', protect, getNearbyVendors);

module.exports = router;