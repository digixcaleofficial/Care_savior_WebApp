const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    unique: true // ⚠️ IMP: Ab Phone hi login ID hai, toh duplicate nahi hona chahiye
  },
  // ❌ PASSWORD FIELD REMOVED (Ab OTP se login hoga)

  // Professional Details
  serviceType: {
    type: String,
    enum: ['Doctor', 'Nurse', 'Ambulance'], 
    required: [true, 'Please select a service type']
  },
  
  // Human Readable Address (e.g., "Shop No 5, MG Road...")
  address: {
    type: String,
    required: [true, 'Please add an address']
  },

  role: {
    type: String,
    default: 'vendor', // Hardcoded default
    immutable: true // Koi change na kar paye
  },

  // Admin Verification Logic
  isVerified: {
    type: Boolean,
    default: true // SignUp ke baad 'Under Review' rahega
  },

  // Toggle Button (Online/Offline) - Driver App jaisa
  isAvailable: {
    type: Boolean,
    default: true 
  },

  // ⭐ GEOSPATIAL DATA (Location Logic)
  location: {
    type: {
      type: String,
      enum: ['Point'], 
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [Longitude, Latitude]
      required: true
    }
  },

  // KYC Documents
  documents: {
    aadhaar: { type: String },
    license: { type: String }
  }

}, { timestamps: true });

// 🌍 Location Indexing (Search query fast karne ke liye)
vendorSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Vendor', vendorSchema);