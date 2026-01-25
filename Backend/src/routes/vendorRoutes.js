const express = require('express');
const router = express.Router();
const { uploadKYC, toggleVendorStatus } = require('../controllers/vendorController');
const { protect, authorize, isVerifiedVendor} = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware'); // Kal banaya tha

// Upload route (Login required + File required)
router.post('/upload-kyc', protect, upload.single('document'), uploadKYC);
router.patch(
  '/toggle-status', 
  protect,              // Login hona zaroori hai
  authorize('vendor'),
  // isVerifiedVendor,     // Sirf verified vendor hi access kar sakta hai
  toggleVendorStatus
);
module.exports = router;