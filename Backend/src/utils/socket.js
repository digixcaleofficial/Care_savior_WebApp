const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*", // Frontend URL (Development ke liye star thik hai)
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 New Client Connected:', socket.id);

    // 👇 UPDATE: Generic Join Logic (User AUR Vendor dono ke liye)
    // Frontend se hum 'setup' event bhejenge user data ke saath
    socket.on('setup', (userData) => {
      if (userData && userData._id) {
        socket.join(userData._id); // 👈 ID ke naam ka Room join kiya
        console.log(`✅ User/Vendor joined room: ${userData._id}`);
        socket.emit('connected');
      }
    });

    // 2. Disconnect Logic
    socket.on('disconnect', () => {
      console.log('❌ Client Disconnected:', socket.id);
    });
  });

  return io;
};

// Controller mein use karne ke liye export function
const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIo };