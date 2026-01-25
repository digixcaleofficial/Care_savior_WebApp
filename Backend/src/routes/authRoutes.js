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


router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
// User Registration Route
router.post('/register-user', registerUser);

// Vendor Registration Route
router.post('/register-vendor', registerVendor);

router.get('/me', getMe);           // Load Profile
router.put('/updatedetails', updateDetails); // Edit Profile
router.get('/logout', logoutUser);
router.delete('/delete', deleteAccount);



module.exports = router;