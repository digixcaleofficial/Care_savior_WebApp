const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
    unique: true 
  },
  role: {
    type: String,
    enum: ['user', 'admin'], 
    default: 'user'
  },
  address: {
    type: String // Human readable address
  },
  
  // 👇 YE NEW FIELD ADD KAR (Vendor jaisa same)
  location: {
    type: {
      type: String,
      enum: ['Point'], 
      default: 'Point'
    },
    coordinates: {
      type: [Number], // Format: [Longitude, Latitude] ⚠️ Order matter karta hai!
      index: '2dsphere' // Search fast karne ke liye
    }
  }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);