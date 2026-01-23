const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // ------------------------------------
  // 1. PARTICIPANTS (Indexed for performance)
  // ------------------------------------
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Fast lookup: "Show my bookings"
  },
  
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    index: true // Fast lookup: "Show vendor's jobs"
    // Note: Initially null rahega (Broadcast phase mein)
  },

  // ------------------------------------
  // 2. SERVICE DETAILS
  // ------------------------------------
  serviceType: {
    type: String, // e.g., 'Ambulance', 'Nurse'
    enum: ['Doctor', 'Nurse', 'Ambulance'], // 👈 Hamare 3 Fixed Values
    required: [true, 'Please specify the service type']
  },
  
  // Patient info snapshot (Snapshot isliye kyunki agar User profile change kare, toh purani booking ka record na badle)
  patientDetails: {
    name: { type: String, required: true },
    age: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    phone: { type: String, required: true },
    problemDescription: { type: String } // Optional: User bata sake kya issue hai
  },

  // ------------------------------------
  // 3. LOCATION & TIMING
  // ------------------------------------
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [Lng, Lat]
    address: { type: String, required: true }
  },
  
  scheduledDate: {
    type: Date,
    default: Date.now
  },

  // ------------------------------------
  // 4. FINANCIALS (Professional Way)
  // ------------------------------------
  fare: {
    estimated: { type: Number }, // User ko dikhaya gaya price
    final: { type: Number },     // Ride khatam hone ke baad ka actual price
    currency: { type: String, default: 'INR' }
  },

  payment: {
    mode: { type: String, enum: ['cash', 'online'], default: 'cash' },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    transactionId: { type: String } // Razorpay ID yahan aayegi
  },

  // ------------------------------------
  // 5. STATUS MANAGEMENT & SECURITY
  // ------------------------------------
  status: {
    type: String,
    enum: ['pending', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },

  otp: {
    code: { type: String }, // 4 Digit code
    verified: { type: Boolean, default: false }
  },

  cancelReason: { type: String }, // Agar cancel hua toh kyun? (Analytics ke liye)

  // ------------------------------------
  // 6. AUDIT TRAIL (Who changed what and when)
  // ------------------------------------
  timeline: [
    {
      status: { type: String },
      timestamp: { type: Date, default: Date.now },
      message: { type: String } // e.g., "Vendor accepted request"
    }
  ]

}, { timestamps: true });

// Geo-Spatial Indexing (CRITICAL for Day 9 logic)
bookingSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Booking', bookingSchema);