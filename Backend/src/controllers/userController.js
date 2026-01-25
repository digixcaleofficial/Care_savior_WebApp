const Vendor = require('../models/Vendor');

// @desc    Get Vendors within 7km radius
// @route   POST /api/user/nearby-vendors
// @access  Private (User logged in)
exports.getNearbyVendors = async (req, res) => {
  try {
    const { latitude, longitude, serviceType } = req.body;

    // Validation
    if (!latitude || !longitude || !serviceType) {
      return res.status(400).json({ 
        message: 'Latitude, Longitude and Service Type are required' 
      });
    }

    // 🔍 The Magic Logic (MongoDB GeoSpatial Query)
    const vendors = await Vendor.find({
      // isVerified: true, // Sirf verified vendors
      // isOnline: true,   // (Optional: Abhi ke liye comment kar sakte ho agar testing karni hai)
      serviceType: serviceType, // Jaise "Plumber"
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)] // User ki location
          },
          $maxDistance: 7000 // 📍 7000 meters = 7km Radius
        }
      }
    }).select('-password'); // Password mat bhejna client ko

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};