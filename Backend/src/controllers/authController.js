const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Otp = require('../models/Otp'); // 👈 Ensure filename matches
const sendToken = require('../utils/jwtToken');
const axios = require('axios');

exports.sendOtp = async (req, res) => {
  // 1. Variable yahan declare karo taaki Try aur Catch dono mein mile
  let phone; 

  try {
    // 2. Value assign karo
    phone = req.body.phone;

    if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
    }

    // --- OTP GENERATION ---
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // --- DB SAVE ---
    await Otp.deleteMany({ phone });
    await Otp.create({ phone, otp: otpCode });

    console.log(`🔐 Console OTP: ${otpCode}`);

    // --- FAST2SMS CALL ---
    const apiKey = "xNDIyR0aPZOT5GtUXKoCd1b87LYn2gE9ASufHJzre4ckqFQpmlPYZgrdHlyV961i48pLM5kWAC3GzJbU";
    
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=otp&variables_values=${otpCode}&flash=0&numbers=${phone}`;

    const response = await axios.get(url);
    
    if (response.data.return) {
        console.log("✅ SMS Sent:", response.data);
        res.status(200).json({ success: true, message: 'OTP Sent via SMS', phone });
    } else {
        console.error("❌ SMS Error:", response.data);
        res.status(200).json({ success: true, message: 'SMS Failed, check Console for OTP', phone });
    }

  } catch (error) {
    console.error("Server Error:", error.message);
    
    // Ab yahan 'phone' access ho jayega kyunki humne upar 'let phone' kiya hai
    // Agar phone undefined hai (req.body empty thi), toh 'Unknown' bhej denge
    res.status(200).json({ 
        success: true, 
        message: 'Demo Mode: Check Console for OTP', 
        phone: phone || 'Unknown' 
    });
  }
};

// ==========================================
// 1. OTP SYSTEM (Unified Login + Auth) 📲
// ==========================================

// @desc    Step 1: Send OTP to Phone
// @route   POST /api/auth/send-otp
// exports.sendOtp = async (req, res) => {
//   try {
//     const { phone } = req.body;

//     if (!phone) {
//       return res.status(400).json({ message: 'Phone number is required' });
//     }

//     // Note: Hum yahan user check nahi karenge, kyunki naya banda bhi OTP maang sakta hai

//     // Generate 4 Digit OTP
//     const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

//     // Purana OTP delete karke naya save karo
//     await Otp.deleteMany({ phone });
//     await Otp.create({ phone, otp: otpCode });

//     // 📨 LOG (SMS Gateway baad mein)
//     console.log(`\n=============================`);
//     console.log(`🔐 OTP for ${phone}: ${otpCode}`);
//     console.log(`=============================\n`);

//     res.status(200).json({
//       success: true,
//       message: 'OTP sent successfully!',
//       phone
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server Error sending OTP' });
//   }
// };

// @desc    Step 2: Verify OTP & LOGIN (The Master Function 🧠)
// @route   POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    // Frontend se 'role' bhejna zaroori hai (user/vendor)
    const { phone, otp, role } = req.body;

    if (!phone || !otp || !role) {
      return res.status(400).json({ message: 'Phone, OTP, and Role are required' });
    }

    // 1. Check OTP in DB
    const validOtp = await Otp.findOne({ phone, otp });
    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid or Expired OTP' });
    }

    // 2. Decide Collection based on Role
    let account = null;

    if (role === 'vendor') {
      account = await Vendor.findOne({ phone });
    } else {
      account = await User.findOne({ phone });
    }

    // === SCENARIO A: ACCOUNT EXISTS (LOGIN) 🚪 ===
    if (account) {
      // OTP safai
      await Otp.deleteMany({ phone });

      // Seedha Token bhej do (Login Success)
      return sendToken(account, 200, res);
    }

    // === SCENARIO B: NEW USER (REGISTER) 📝 ===
    // Hum token nahi bhejenge, bas bataenge ki OTP sahi tha
    res.status(200).json({
      success: true,
      message: 'OTP Verified. User is new, please register.',
      isNewUser: true, // Frontend isse dekh kar Registration Form khol dega
      role: role // Wapas bhej rahe hain taaki frontend ko yaad rahe
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error verifying OTP' });
  }
};

// ==========================================
// 2. REGISTRATION FLOW (Passwordless)
// ==========================================

// @desc    Register User (Patient)
// @route   POST /api/auth/register-user
const capitalize = (s) => s && s.charAt(0).toUpperCase() + s.slice(1);

// @desc    Register User (Patient)
// @route   POST /api/auth/register-user
// Backend/src/controllers/authController.js

// ... imports same rahenge ...

// ----------------------------------------------------
// FIX 1: REGISTER USER (Check if phone exists in Vendor)
// ----------------------------------------------------
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, address, latitude, longitude, otp } = req.body;

    if (!otp) return res.status(400).json({ message: 'OTP is required' });

    // 1. Verify OTP
    const validOtp = await Otp.findOne({ phone, otp });
    if (!validOtp) return res.status(400).json({ message: 'Session expired or Invalid OTP' });

    // 2. 🛑 CROSS-CHECK: Kya ye number Vendor list mein hai?
    const vendorExists = await Vendor.findOne({ phone });
    if (vendorExists) {
      return res.status(400).json({ 
        message: 'This number is already registered as a Partner/Vendor. Please use a different number for User account.' 
      });
    }

    // 3. Normal Check (User duplicate)
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already registered with this email or phone' });
    }

    // 4. Location Logic
    let locationData = undefined;
    if (latitude && longitude) {
      locationData = { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] };
    }

    // 5. Create User
    const user = await User.create({
      name, email, phone, address, 
      role: 'user', 
      location: locationData
    });

    if (user) {
      await Otp.deleteMany({ phone });
      sendToken(user, 201, res);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ----------------------------------------------------
// FIX 2: REGISTER VENDOR (Check if phone exists in User)
// ----------------------------------------------------
exports.registerVendor = async (req, res) => {
  try {
    const { name, email, phone, serviceType, address, latitude, longitude, otp } = req.body;

    if (!latitude || !longitude) return res.status(400).json({ message: 'Location required' });
    if (!otp) return res.status(400).json({ message: 'OTP required' });

    const validOtp = await Otp.findOne({ phone, otp });
    if (!validOtp) return res.status(400).json({ message: 'Invalid OTP' });

    // 🛑 CROSS-CHECK: Kya ye number User list mein hai?
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ 
        message: 'This number is already registered as a User/Patient. Please use a different number for Partner account.' 
      });
    }

    const vendorExists = await Vendor.findOne({ $or: [{ email }, { phone }] });
    if (vendorExists) return res.status(400).json({ message: 'Vendor already registered' });

    const formattedServiceType = serviceType.charAt(0).toUpperCase() + serviceType.slice(1);

    const vendor = await Vendor.create({
      name, email, phone, 
      serviceType: formattedServiceType, 
      address,
      role: 'vendor', // 👈 Ab Model mein field hai, toh ye save hoga
      location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
      isVerified: false
    });

    if (vendor) {
      await Otp.deleteMany({ phone });
      sendToken(vendor, 201, res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
// @desc    Logout
// @route   GET /api/auth/logout
exports.logoutUser = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out' });
};