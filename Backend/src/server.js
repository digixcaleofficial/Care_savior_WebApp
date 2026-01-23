require('dotenv').config(); 
const app = require('./app');
const connectDB = require('./config/db');
const http = require('http'); // 👈 Native module
const { initSocket } = require('./utils/socket'); // 👈 Import kiya

const PORT = process.env.PORT || 5000;

// 👇 STEP 1: HTTP Server Create karo (Express app ko isme wrap karo)
const server = http.createServer(app);

// 👇 STEP 2: Socket.io ko is server ke saath jod do
const io = initSocket(server);

// 👇 STEP 3: 'io' ko app mein save kar do taaki Controllers use kar sakein
// (Isse tum req.app.get('io') karke controller mein access kar paoge)
app.set('io', io);

// Database connect hone ke baad server start hoga
connectDB().then(() => {
  // 👇 STEP 4: Dhyan dena: Yahan 'app.listen' nahi 'server.listen' hoga!
  server.listen(PORT, () => {
    console.log(`\n⚙️  Server running on port ${PORT}`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`📡 Socket.io Initialized & Ready`);
  });
});