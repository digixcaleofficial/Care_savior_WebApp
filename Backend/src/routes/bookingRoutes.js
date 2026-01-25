const express = require('express');
const router = express.Router();
const { createBooking, acceptBooking, startJob, completeJob, getMyBookings, getBookingDetails } = require('../controllers/bookingController');
const { protect, authorize, isVerifiedVendor } = require('../middlewares/authMiddleware');
const { cancelBooking, updateBooking } = require('../controllers/bookingController');
// Route: POST /api/booking/create
// Isse sirf 'user' role access kar sakta hai, vendor ya admin nahi
router.post(
  '/create', 
  protect, 
  authorize('user'), 
  createBooking
); 

router.patch( // Update kar rahe hain isliye PATCH better hai, POST bhi chalega
  '/accept',
  protect,
  authorize('vendor'),
  // isVerifiedVendor, // Sirf Vendor accept kar sakta hai
  acceptBooking
);

// Route: POST /api/booking/start-job
router.post(
  '/start-job',
  protect,
  authorize('vendor'),
  // isVerifiedVendor,
  startJob
);

// Route: POST /api/booking/complete-job
router.post(
  '/complete-job',
  protect,
  authorize('vendor'),
  // isVerifiedVendor,
  completeJob
);



// ... existing routes
router.put('/cancel', protect, cancelBooking);
router.put('/update', protect, updateBooking);

router.get('/my-bookings', protect, getMyBookings); // List nikalne ke liye
router.get('/:id', protect, getBookingDetails);

module.exports = router;