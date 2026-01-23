const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Otp = require('../models/Otp'); // 👈 Ensure filename matches
const sendToken = require('../utils/jwtToken');

// ==========================================
// 1. OTP SYSTEM (Unified Login + Auth) 📲
// ==========================================

// @desc    Step 1: Send OTP to Phone
// @route   POST /api/auth/send-otp
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Note: Hum yahan user check nahi karenge, kyunki naya banda bhi OTP maang sakta hai

    // Generate 4 Digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Purana OTP delete karke naya save karo
    await Otp.deleteMany({ phone });
    await Otp.create({ phone, otp: otpCode });

    // 📨 LOG (SMS Gateway baad mein)
    console.log(`\n=============================`);
    console.log(`🔐 OTP for ${phone}: ${otpCode}`);
    console.log(`=============================\n`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully!',
      phone
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error sending OTP' });
  }
};

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
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, address, latitude, longitude, otp } = req.body;

    // 1. Validation
    if (!otp) return res.status(400).json({ message: 'OTP is required' });

    // 2. Security Check (Valid OTP)
    const validOtp = await Otp.findOne({ phone, otp });
    if (!validOtp) {
      return res.status(400).json({ message: 'Session expired or Invalid OTP' });
    }

    // 3. Check Email Duplicate
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // 4. Prepare Location Data (Agar frontend ne bheja hai)
    let locationData = undefined;
    if (latitude && longitude) {
      locationData = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)] // ⚠️ IMP: [Long, Lat]
      };
    }

    // 5. Create User
    const user = await User.create({
      name,
      email,
      phone,
      address,
      role: 'user',
      location: locationData // 👈 Ab Location bhi save hogi
    });

    if (user) {
      // Login success, OTP delete karo
      await Otp.deleteMany({ phone });
      sendToken(user, 201, res);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Register Vendor (Partner)
// @route   POST /api/auth/register-vendor
exports.registerVendor = async (req, res) => {
  try {
    const { name, email, phone, serviceType, address, latitude, longitude, otp } = req.body;

    // 1. Validation
    if (!latitude || !longitude) return res.status(400).json({ message: 'Location is required for Partners' });
    if (!otp) return res.status(400).json({ message: 'OTP is required' });

    // 2. Security Check
    const validOtp = await Otp.findOne({ phone, otp });
    if (!validOtp) return res.status(400).json({ message: 'Session expired or Invalid OTP' });

    // 3. Check Duplicate
    const vendorExists = await Vendor.findOne({ email });
    if (vendorExists) return res.status(400).json({ message: 'Email already registered' });

    // 4. Format Service Type (Frontend sends 'doctor', Model needs 'Doctor')
    // Agar frontend already Capital bhej raha hai toh thik, warna ye safe side ke liye hai
    const formattedServiceType = capitalize(serviceType);

    // 5. Create Vendor
    const vendor = await Vendor.create({
      name,
      email,
      phone,
      serviceType: formattedServiceType, // 👈 Capitalized Value
      address,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)] // ⚠️ IMP: [Long, Lat]
      },
      isVerified: false
    });

    if (vendor) {
      await Otp.deleteMany({ phone });
      sendToken(vendor, 201, res);
    }
  } catch (error) {
    console.error(error); // Console mein error dekhne ke liye
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