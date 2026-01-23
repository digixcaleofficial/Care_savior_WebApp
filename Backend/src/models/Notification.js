const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel', // 👈 User ya Vendor dono ke liye dynamic
    required: true
  },
  onModel: {
    type: String,
    required: true,
    enum: ['User', 'Vendor']
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['NEW_REQUEST', 'BOOKING_ACCEPTED', 'SYSTEM', 'APPROVAL'], 
    default: 'SYSTEM' 
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);