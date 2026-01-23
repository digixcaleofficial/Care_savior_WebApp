const Vendor = require('../models/Vendor');
const cloudinary = require('../config/cloudinary');
const fs = require('fs'); // File delete karne ke liye

// @desc    Upload KYC Documents
// @route   POST /api/vendor/upload-kyc
// @access  Private (Vendor Only)
exports.uploadKYC = async (req, res) => {
  try {
    // Check agar file aayi hai
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // 1. Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'care_saviour_kyc', // Cloudinary pe folder ka naam
    });

    // 2. Local file delete karna (Server clean rakhne ke liye)
    fs.unlinkSync(req.file.path);

    // 3. Database Update karna (Vendor ke document field mein URL dalna)
    const vendor = await Vendor.findById(req.user._id);
    
    // Example: Agar ye Aadhaar hai (Logic extend kar sakte ho multiple files ke liye)
    // Filhal hum man rahe hain ek document upload ho raha hai 'license' field mein
    vendor.documents.license = result.secure_url;
    await vendor.save();

    res.status(200).json({
      message: 'Document uploaded successfully',
      url: result.secure_url
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle Vendor Availability (Online/Offline)
// @route   PATCH /api/vendor/toggle-status
// @access  Private (Vendor only)
exports.toggleVendorStatus = async (req, res) => {
  try {
    // 1. Logged in vendor ki ID nikalo
    const vendorId = req.user._id;

    // 2. Vendor ko dhoondo
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // 3. Status ko ulta (Toggle) kar do
    // Agar true hai toh false, false hai toh true
    vendor.isAvailable = !vendor.isAvailable;
    
    await vendor.save();

    res.status(200).json({
      success: true,
      message: vendor.isAvailable ? 'You are now ONLINE 🟢' : 'You are now OFFLINE 🔴',
      isAvailable: vendor.isAvailable
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};