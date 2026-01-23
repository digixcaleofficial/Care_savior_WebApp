const express = require('express');
const router = express.Router();
const { verifyVendor } = require('../controllers/adminController');
const { protect, adminOnly, authorize} = require('../middlewares/authMiddleware');

// Verify route (Login required + Admin required)
router.put('/verify-vendor/:id', protect, authorize('admin'), verifyVendor);

module.exports = router;