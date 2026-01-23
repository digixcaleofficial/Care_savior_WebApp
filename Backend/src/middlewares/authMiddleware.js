const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

// 1. Login Check (Protect Route)
const protect = async (req, res, next) => {
  let token;

  // Debugging logs (Rehne de, helpful hain)
  console.log("Cookies received:", req.cookies); 
  console.log("Headers received:", req.headers.authorization);

  // STEP 1: Token Extract Karo (Priority: Header > Cookie)
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Option A: Header se mila
    token = req.headers.authorization.split(' ')[1];
  } 
  else if (req.cookies.token) {
    // Option B: Cookie se mila (Ye logic pehle missing tha/kaam nahi kar raha tha)
    token = req.cookies.token;
  }

  // STEP 2: Agar Token kahin nahi mila -> Error
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  // STEP 3: Verify Token (Ab ye block bahar hai, toh sabke liye chalega)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // User ya Vendor dhoondna DB mein
    if (decoded.role === 'vendor') {
      req.user = await Vendor.findById(decoded.id).select('-password');
      // Safety: Agar DB se delete ho gaya ho
      if (!req.user) {
         return res.status(401).json({ message: 'Vendor not found' });
      }
      req.user.role = 'vendor'; // Explicitly setting role
    } else {
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
     }
    }

    next(); // Sab sahi hai, aage badho

  } catch (error) {
    console.error("Token Verification Error:", error.message);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// 2. Admin Check (Sirf Admin allowed)
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // req.user.role humne protect middleware mein set kiya tha
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role (${req.user.role}) is not allowed to access this resource` 
      });
    }
    next();
  };
};

const isVerifiedVendor = (req, res, next) => {
  // Pehle check karo ki ye Vendor hi hai na?
  if (req.user.role !== 'vendor') {
    // Agar User/Admin hai toh ye rule unpe lagu nahi hota, aage jane do
    return next();
  }

  // Agar Vendor hai, toh check karo verified hai ya nahi
  if (!req.user.isVerified) {
    return res.status(403).json({ 
      success: false,
      message: '⛔ Access Denied: Your account is under review. Please wait for Admin approval.',
      isVerified: false // Frontend isse dekh kar "Under Review" screen dikhayega
    });
  }

  // Agar Verified hai, toh aage badho
  next();
};


module.exports = { protect, adminOnly, authorize, isVerifiedVendor };