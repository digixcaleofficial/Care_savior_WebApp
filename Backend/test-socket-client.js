const io = require('socket.io-client');

// 👇 IMP: Yahan apne Database se kisi REAL Vendor ki ID daalo
// Wo Vendor jo 'Online' ho aur 'Verified' ho.
const MY_VENDOR_ID = "69676883a9b3984c196e0be5"; // <--- ISSE REPLACE KARO

// Server se connect karo
const socket = io('http://localhost:5000'); 

console.log('🔄 Connecting to server...');

socket.on('connect', () => {
  console.log('✅ Connected successfully! Socket ID:', socket.id);
  
  // Server ko batao: "Main Vendor hu, mujhe mere Room mein daalo"
  // Ye event humne socket.js mein define kiya tha
  socket.emit('join_vendor_room', MY_VENDOR_ID);
  console.log(`📡 Joined Room: ${MY_VENDOR_ID}`);
  console.log('👂 Listening for notifications...');
});

// Jab Booking aayegi, ye event fire hoga
socket.on('new_request', (data) => {
  console.log('\n\n=======================================');
  console.log('🚨 TRING TRING! NEW BOOKING REQUEST! 🚨');
  console.log('=======================================');
  console.log('Patient Name:', data.patientName);
  console.log('Service:', data.serviceType);
  console.log('Location:', data.location);
  console.log('Date:', data.scheduledDate);
  console.log('=======================================\n');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});