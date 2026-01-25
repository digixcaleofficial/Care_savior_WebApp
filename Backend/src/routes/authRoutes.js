const express = require('express');
const router = express.Router();
const { registerUser, 
    registerVendor, 
    sendOtp,   // 👈 New
    verifyOtp,
    logoutUser,
    getMe, 
    updateDetails, 
    deleteAccount } = require('./../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');


router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
// User Registration Route
router.post('/register-user', registerUser);

// Vendor Registration Route
router.post('/register-vendor', registerVendor);

router.get('/me', protect, getMe);           // Load Profile
router.put('/updatedetails', protect, updateDetails); // Edit Profile
router.get('/logout', logoutUser);
router.delete('/delete', protect, deleteAccount);



module.exports = router;