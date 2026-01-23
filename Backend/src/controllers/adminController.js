const Vendor = require('../models/Vendor');

// @desc    Verify a Vendor
// @route   PUT /api/admin/verify-vendor/:id
// @access  Private (Admin Only)
exports.verifyVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (vendor) {
      vendor.isVerified = true;
      await vendor.save();
      res.json({ message: `Vendor ${vendor.name} is now Verified! ✅` });
    } else {
      res.status(404).json({ message: 'Vendor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};