const jwt = require('jsonwebtoken');

// Token create karke cookie mein save karne wala function
const sendToken = (user, statusCode, res) => {
  
  // 1. Token Generate karo (Jo logic tumhare controller mein tha, wo ab yahan hai)
  // Hum maan ke chal rahe hain user ka role 'user' hai agar defined nahi hai toh
  const token = jwt.sign(
    { id: user._id, role: user.role || 'vendor' }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  // 2. Cookie Options set karo
  const options = {
    expires: new Date(
      Date.now() + (process.env.COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Security: Client side JS isse access nahi kar sakti
    secure: false, // HTTPS only in production
    sameSite: 'lax'
  };

  // 3. Response bhejo (Cookie + JSON data)
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    user, // Vendor ke liye useful hai
    token, // Frontend development ke liye kabhi kabhi zaroorat padti hai
  });
};

module.exports = sendToken;