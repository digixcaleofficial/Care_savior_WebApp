const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

// 1. Login Check (Protect Route)
const protect = async (req, res, next) => {
  let token;

  // STEP 1: Token Extract Karo (Header ya Cookie se)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // 🛑 Check for missing or garbage token
  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ message: 'Not authorized, please login first' });
  }

  // STEP 2: Verify Token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Role ke hisab se DB check karo
    if (decoded.role === 'vendor') {
      req.user = await Vendor.findById(decoded.id).select('-password');
      if (!req.user) return res.status(401).json({ message: 'Vendor account not found' });
      req.user.role = 'vendor'; 
    } else {
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) return res.status(401).json({ message: 'User account not found' });
      // Role user ya admin ho sakta hai, DB se jo aayega wahi rahega
    }

    next(); // Sab sahi hai, aage badho

  } catch (error) {
    console.error("Auth Error:", error.message);
    res.status(401).json({ message: 'Session expired, please login again' });
  }
};

// 2. Role Authorization (Admin, User, Vendor logic handle karega)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role (${req.user.role}) is not allowed to access this resource` 
      });
    }
    next();
  };
};

// 3. Vendor Verification Check
const isVerifiedVendor = (req, res, next) => {
  if (req.user.role === 'vendor' && !req.user.isVerified) {
    return res.status(403).json({ 
      success: false,
      message: 'Account Under Review. Please wait for Admin approval.',
      // isVerified: true
    });
  }
  next();
};

module.exports = { protect, authorize, isVerifiedVendor };