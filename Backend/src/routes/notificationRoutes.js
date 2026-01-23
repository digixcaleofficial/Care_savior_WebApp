const express = require('express');
const router = express.Router();

// Controller Functions Import karo
const { getMyNotifications, markAsRead } = require('../controllers/notificationController');

// Tera Auth Middleware Import kar (Naam check kar lena apne project mein)
const { protect } = require('../middlewares/authMiddleware'); 

// Routes
router.get('/', protect, getMyNotifications);      // GET /api/notifications
router.put('/:id/read', protect, markAsRead);      // PUT /api/notifications/:id/read

module.exports = router;