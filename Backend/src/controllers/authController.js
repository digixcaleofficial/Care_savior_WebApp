const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Otp = require('../models/Otp'); // 👈 Ensure filename matches
const sendToken = require('../utils/jwtToken');
const axios = require('axios');

// exports.sendOtp = async (req, res) => {
//   // 1. Variable yahan declare karo taaki Try aur Catch dono mein mile
//   let phone; 

//   try {
//     // 2. Value assign karo
//     phone = req.body.phone;

//     if (!phone) {
//         return res.status(400).json({ message: "Phone number is required" });
//     }

//     // --- OTP GENERATION ---
//     const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

//     // --- DB SAVE ---
//     await Otp.deleteMany({ phone });
//     await Otp.create({ phone, otp: otpCode });

//     console.log(`🔐 Console OTP: ${otpCode}`);

//     // --- FAST2SMS CALL ---
//     const apiKey = "xNDIyR0aPZOT5GtUXKoCd1b87LYn2gE9ASufHJzre4ckqFQpmlPYZgrdHlyV961i48pLM5kWAC3GzJbU";
    
//     const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=otp&variables_values=${otpCode}&flash=0&numbers=${phone}`;

//     const response = await axios.get(url);
    
//     if (response.data.return) {
//         console.log("✅ SMS Sent:", response.data);
//         res.status(200).json({ success: true, message: 'OTP Sent via SMS', phone });
//     } else {
//         console.error("❌ SMS Error:", response.data);
//         res.status(200).json({ success: true, message: 'SMS Failed, check Console for OTP', phone });
//     }

//   } catch (error) {
//     console.error("Server Error:", error.message);
    
//     // Ab yahan 'phone' access ho jayega kyunki humne upar 'let phone' kiya hai
//     // Agar phone undefined hai (req.body empty thi), toh 'Unknown' bhej denge
//     res.status(200).json({ 
//         success: true, 
//         message: 'Demo Mode: Check Console for OTP', 
//         phone: phone || 'Unknown' 
//     });
//   }
// };

exports.sendOtp = async (req, res) => {
  let phone; 
  try {
    phone = req.body.phone;
    if (!phone) return res.status(400).json({ message: "Phone number is required" });

    // 🛑 CLIENT DEMO: Hamesha 1234 rahega logic ke liye
    // Frontend pe user ko bolo bas 1234 dale
    const otpCode = '1234'; 

    console.log(`🔐 Console OTP: ${otpCode}`);

    // Fast2SMS ya DB save ki zaroorat nahi hai demo ke liye
    // Par flow na toote isliye success response bhej rahe hain
    
    res.status(200).json({ 
        success: true, 
        message: 'OTP Sent! (Use 1234)', 
        phone 
    });

  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp, role } = req.body;

    if (!phone || !otp || !role) {
      return res.status(400).json({ message: 'Phone, OTP, and Role are required' });
    }

    // 🛑 BYPASS LOGIC START: DB Check Comment kar diya
    // const validOtp = await Otp.findOne({ phone, otp });
    
    // Sirf ye check karo ki OTP 1234 hai ya nahi
    if (otp !== '1234') {
      return res.status(400).json({ message: 'Invalid Demo OTP (Please use 1234)' });
    }
    // 🛑 BYPASS LOGIC END

    // 2. Decide Collection based on Role
    let account = null;

    if (role === 'vendor') {
      account = await Vendor.findOne({ phone });
    } else {
      account = await User.findOne({ phone });
    }

    // === SCENARIO A: ACCOUNT EXISTS (LOGIN) 🚪 ===
    if (account) {
      // Seedha Token bhej do (Login Success)
      return sendToken(account, 200, res);
    }

    // === SCENARIO B: NEW USER (REGISTER) 📝 ===
    res.status(200).json({
      success: true,
      message: 'OTP Verified. New User.',
      isNewUser: true, // Frontend Registration form kholega
      role: role
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error verifying OTP' });
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
// exports.verifyOtp = async (req, res) => {
//   try {
//     // Frontend se 'role' bhejna zaroori hai (user/vendor)
//     const { phone, otp, role } = req.body;

//     if (!phone || !otp || !role) {
//       return res.status(400).json({ message: 'Phone, OTP, and Role are required' });
//     }

//     // 1. Check OTP in DB
//     const validOtp = await Otp.findOne({ phone, otp });
//     if (!validOtp) {
//       return res.status(400).json({ message: 'Invalid or Expired OTP' });
//     }

//     // 2. Decide Collection based on Role
//     let account = null;

//     if (role === 'vendor') {
//       account = await Vendor.findOne({ phone });
//     } else {
//       account = await User.findOne({ phone });
//     }

//     // === SCENARIO A: ACCOUNT EXISTS (LOGIN) 🚪 ===
//     if (account) {
//       // OTP safai
//       await Otp.deleteMany({ phone });

//       // Seedha Token bhej do (Login Success)
//       return sendToken(account, 200, res);
//     }

//     // === SCENARIO B: NEW USER (REGISTER) 📝 ===
//     // Hum token nahi bhejenge, bas bataenge ki OTP sahi tha
//     res.status(200).json({
//       success: true,
//       message: 'OTP Verified. User is new, please register.',
//       isNewUser: true, // Frontend isse dekh kar Registration Form khol dega
//       role: role // Wapas bhej rahe hain taaki frontend ko yaad rahe
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server Error verifying OTP' });
//   }
// };

// ==========================================
// 2. REGISTRATION FLOW (Passwordless)
// ==========================================

// @desc    Register User (Patient)
// @route   POST /api/auth/register-user
const capitalize = (s) => s && s.charAt(0).toUpperCase() + s.slice(1);

// // @desc    Register User (Patient)
// // @route   POST /api/auth/register-user
// // Backend/src/controllers/authController.js

// // ... imports same rahenge ...

// // ----------------------------------------------------
// // FIX 1: REGISTER USER (Check if phone exists in Vendor)
// // ----------------------------------------------------
// exports.registerUser = async (req, res) => {
//   try {
//     const { name, email, phone, address, latitude, longitude, otp } = req.body;

//     if (!otp) return res.status(400).json({ message: 'OTP is required' });

//     // 1. Verify OTP
//     const validOtp = await Otp.findOne({ phone, otp });
//     if (!validOtp) return res.status(400).json({ message: 'Session expired or Invalid OTP' });

//     // 2. 🛑 CROSS-CHECK: Kya ye number Vendor list mein hai?
//     const vendorExists = await Vendor.findOne({ phone });
//     if (vendorExists) {
//       return res.status(400).json({ 
//         message: 'This number is already registered as a Partner/Vendor. Please use a different number for User account.' 
//       });
//     }

//     // 3. Normal Check (User duplicate)
//     const userExists = await User.findOne({ $or: [{ email }, { phone }] });
//     if (userExists) {
//       return res.status(400).json({ message: 'User already registered with this email or phone' });
//     }

//     // 4. Location Logic
//     let locationData = undefined;
//     if (latitude && longitude) {
//       locationData = { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] };
//     }

//     // 5. Create User
//     const user = await User.create({
//       name, email, phone, address, 
//       role: 'user', 
//       location: locationData
//     });

//     if (user) {
//       await Otp.deleteMany({ phone });
//       sendToken(user, 201, res);
//     }

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// };

// // ----------------------------------------------------
// // FIX 2: REGISTER VENDOR (Check if phone exists in User)
// // ----------------------------------------------------
// exports.registerVendor = async (req, res) => {
//   try {
//     const { name, email, phone, serviceType, address, latitude, longitude, otp } = req.body;

//     if (!latitude || !longitude) return res.status(400).json({ message: 'Location required' });
//     if (!otp) return res.status(400).json({ message: 'OTP required' });

//     const validOtp = await Otp.findOne({ phone, otp });
//     if (!validOtp) return res.status(400).json({ message: 'Invalid OTP' });

//     // 🛑 CROSS-CHECK: Kya ye number User list mein hai?
//     const userExists = await User.findOne({ phone });
//     if (userExists) {
//       return res.status(400).json({ 
//         message: 'This number is already registered as a User/Patient. Please use a different number for Partner account.' 
//       });
//     }

//     const vendorExists = await Vendor.findOne({ $or: [{ email }, { phone }] });
//     if (vendorExists) return res.status(400).json({ message: 'Vendor already registered' });

//     const formattedServiceType = serviceType.charAt(0).toUpperCase() + serviceType.slice(1);

//     const vendor = await Vendor.create({
//       name, email, phone, 
//       serviceType: formattedServiceType, 
//       address,
//       role: 'vendor', // 👈 Ab Model mein field hai, toh ye save hoga
//       location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
//       isVerified: false
//     });

//     if (vendor) {
//       await Otp.deleteMany({ phone });
//       sendToken(vendor, 201, res);
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// };

exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, address, latitude, longitude, otp } = req.body;

    // 🛑 BYPASS OTP CHECK
    if (otp !== '1234') return res.status(400).json({ message: 'Invalid OTP' });

    // Check if Partner
    const vendorExists = await Vendor.findOne({ phone });
    if (vendorExists) {
      return res.status(400).json({ message: 'Number registered as Partner already.' });
    }

    // Check duplicate
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already registered.' });
    }

    // Location Logic
    let locationData = undefined;
    if (latitude && longitude) {
      locationData = { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] };
    }

    // Create User
    const user = await User.create({
      name, email, phone, address, 
      role: 'user', 
      location: locationData
    });

    if (user) {
      sendToken(user, 201, res);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// VENDOR REGISTER
exports.registerVendor = async (req, res) => {
  try {
    const { name, email, phone, serviceType, address, latitude, longitude, otp } = req.body;

    if (!latitude || !longitude) return res.status(400).json({ message: 'Location required' });
    
    // 🛑 BYPASS OTP CHECK
    if (otp !== '1234') return res.status(400).json({ message: 'Invalid OTP' });

    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ message: 'Number registered as User already.' });
    }

    const vendorExists = await Vendor.findOne({ $or: [{ email }, { phone }] });
    if (vendorExists) return res.status(400).json({ message: 'Vendor already registered' });

    const formattedServiceType = serviceType.charAt(0).toUpperCase() + serviceType.slice(1);

    const vendor = await Vendor.create({
      name, email, phone, 
      serviceType: formattedServiceType, 
      address,
      role: 'vendor',
      location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
      isVerified: true
    });

    if (vendor) {
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

// ... Upar Register/Login/OTP code same rahega ...

// -----------------------------------------------------------------------
// 👇 PROFILE MANAGEMENT (USER & VENDOR BOTH)
// -----------------------------------------------------------------------

// @desc    Get Current Logged In Profile
// @route   GET /api/auth/me

// @desc    Register Vendor (Partner)
// @route   POST /api/auth/register-vendor

// @desc    Logout
// @route   GET /api/auth/logout


// -----------------------------------------------------------------------
// 👇 PROFILE MANAGEMENT (USER & VENDOR BOTH)
// -----------------------------------------------------------------------

// @desc    Get Current Logged In Profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // 🛑 SAFETY CHECK ADDED: Agar middleware user set nahi kar paya toh crash mat ho
    if (!req.user) {
        return res.status(401).json({ message: 'Session expired or User not found' });
    }

    let data;

    // Ab bindass role check karo
    if (req.user.role === 'vendor') {
      data = await Vendor.findById(req.user._id).select('-password');
    } else {
      data = await User.findById(req.user._id).select('-password');
    }

    if (!data) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.status(200).json({
      success: true,
      user: data 
    });

  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update Profile Details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const { name, email, address, serviceType, phone } = req.body;

    // 1. Agar Vendor hai toh Vendor collection update karo
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findById(req.user._id);

      if (name) vendor.name = name;
      if (email) vendor.email = email;
      if (address) vendor.address = address;
      if (serviceType) vendor.serviceType = serviceType; // Sirf vendor ke paas ye field hai
      // Phone update karna sensitive ho sakta hai (OTP verification chahiye hota hai usually)
      // Par abhi ke liye allow kar rahe hain:
      if (phone) vendor.phone = phone;

      const updatedVendor = await vendor.save();

      return res.status(200).json({
        success: true,
        message: 'Vendor Profile Updated',
        user: updatedVendor
      });
    } 
    
    // 2. Agar User hai toh User collection update karo
    else {
      const user = await User.findById(req.user._id);

      if (name) user.name = name;
      if (email) user.email = email;
      if (address) user.address = address;
      if (phone) user.phone = phone;

      const updatedUser = await user.save();

      return res.status(200).json({
        success: true,
        message: 'User Profile Updated',
        user: updatedUser
      });
    }

  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: 'Update Failed', error: error.message });
  }
};

// @desc    Delete Account (Permanent)
// @route   DELETE /api/auth/delete
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    // Role check karke sahi jagah se uda do
    if (req.user.role === 'vendor') {
      await Vendor.findByIdAndDelete(req.user._id);
    } else {
      await User.findByIdAndDelete(req.user._id);
    }

    // Cookie bhi saaf karni padegi
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({ success: true, message: 'Account permanently deleted' });

  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: 'Delete Failed' });
  }
};