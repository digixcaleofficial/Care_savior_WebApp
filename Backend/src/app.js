const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/authRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middlewares

app.use(express.json()); // JSON data padhne ke liye
app.use(cors({ origin: "*",
  credentials: true
})); // Frontend connect karne ke liye
app.use(helmet()); // Security headers add karne ke liye
app.use(morgan('dev'));
app.use(cookieParser()); // Console mein request logs dikhane ke liye
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
// Test Route (Sirf check karne ke liye)
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Care Saviour Server is Running! 🚀' });
});

module.exports = app;