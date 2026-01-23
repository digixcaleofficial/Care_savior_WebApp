const express = require('express');
const router = express.Router();
const { registerUser, 
    registerVendor, 
    sendOtp,   // 👈 New
    verifyOtp,
    logoutUser } = require('./../controllers/authcontroller');


router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
// User Registration Route
router.post('/register-user', registerUser);

// Vendor Registration Route
router.post('/register-vendor', registerVendor);

router.get('/logout', logoutUser);

module.exports = router;