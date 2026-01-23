import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BookingStatusStepper from '../components/BookingStatusStepper';
import BottomNav from '../components/layout/BottomNav';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Booking Data
  const fetchBooking = async () => {
    try {
      const token = localStorage.getItem('token');
      // LocalStorage se user nikal rahe hain
      const user = JSON.parse(localStorage.getItem('userInfo')); 
      setCurrentUser(user);

      const res = await axios.get(`/api/booking/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooking(res.data.booking);
      setLoading(false);
    } catch (err) {
      console.error(err);
      // alert('Failed to load booking'); // Commented out to avoid annoyance
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooking(); }, [id]);

  // --- ACTIONS ---

  const handleVerifyOTP = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/booking/start-job', 
        { bookingId: id, otp: otpInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('OTP Verified! Job Started.'); 
      setShowOtpModal(false);
      fetchBooking(); 
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid OTP');
    }
  };

  const handleCompleteJob = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/booking/complete-job', 
        { bookingId: id, finalAmount: booking.fare.estimated, paymentMode: 'cash' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Job Completed Successfully!');
      fetchBooking();
    } catch (err) {
      alert('Error completing job');
    }
  };

  const handleCancel = async () => {
      if(!window.confirm("Are you sure you want to cancel this booking?")) return;
      try {
        const token = localStorage.getItem('token');
        await axios.put('/api/booking/cancel', 
            { bookingId: id, reason: 'User requested cancellation' },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Booking Cancelled');
        fetchBooking();
      } catch (error) {
          alert('Error cancelling booking');
      }
  };

  if (loading) return <div className="flex h-screen justify-center items-center">Loading...</div>;
  if (!booking) return <div className="p-10 text-center">Booking not found.</div>;

  // ============================================================
  // 👇 MAIN FIX: ID COMPARISON LOGIC (String Convert kiya hai)
  // ============================================================
  
  // Debugging ke liye Console check karna agar fir bhi dikkat aaye
  console.log("Current User ID:", currentUser?._id);
  console.log("Customer ID:", booking.customer?._id);
  
  const isUser = currentUser && booking.customer && (String(currentUser._id) === String(booking.customer._id));
  
  const isVendor = currentUser && booking.vendor && (String(currentUser._id) === String(booking.vendor._id));

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="bg-white p-4 shadow sticky top-0 z-10 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 text-xl font-bold">←</button>
          <h1 className="text-lg font-bold">Booking #{booking._id.slice(-6).toUpperCase()}</h1>
      </div>

      <div className="max-w-md mx-auto p-4">
            
            {/* Status Bar */}
            <BookingStatusStepper status={booking.status} />
            
            {/* Main Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mt-4 space-y-4">
                
                {/* Service Info */}
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Service</span>
                        <h2 className="text-2xl font-bold text-gray-800">{booking.serviceType}</h2>
                        <p className="text-sm text-gray-500 mt-1">For: {booking.patientDetails.name} ({booking.patientDetails.gender})</p>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Price</span>
                        <p className="text-xl font-bold text-green-600">₹{booking.fare.estimated}</p>
                        <p className="text-xs text-gray-400">{booking.payment.mode}</p>
                    </div>
                </div>

                <hr className="border-dashed border-gray-200" />

                {/* Location */}
                <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Location</span>
                    <p className="text-gray-700 font-medium mt-1">📍 {booking.location.address}</p>
                </div>
            </div>

            {/* ================= USER INTERFACE ================= */}
            {isUser && (
                <div className="mt-6 animate-fade-in">
                    
                    {/* CASE 1: Pending */}
                    {booking.status === 'pending' && (
                        <div className="space-y-3">
                             <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-800 text-sm">
                                ⏳ Searching for nearby vendors...
                             </div>
                             <div className="flex gap-3">
                                <button onClick={handleCancel} className="flex-1 py-3 border border-red-500 text-red-500 rounded-xl font-bold hover:bg-red-50">Cancel</button>
                                <button className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">Edit Details</button>
                             </div>
                        </div>
                    )}

                    {/* CASE 2: Accepted -> SHOW OTP */}
                    {booking.status === 'accepted' && (
                        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg text-center transform scale-100 transition-transform">
                            <p className="text-sm font-medium opacity-80 mb-2">GIVE THIS OTP TO VENDOR</p>
                            <div className="bg-white text-blue-600 text-5xl font-mono font-black tracking-widest py-3 rounded-xl shadow-inner mb-2">
                                {booking.otp?.code || '----'}
                            </div>
                            <p className="text-xs opacity-70">Vendor: {booking.vendor?.name} is arriving.</p>
                        </div>
                    )}

                    {/* CASE 3: In Progress */}
                    {booking.status === 'in_progress' && (
                         <div className="bg-green-100 border border-green-300 p-4 rounded-xl text-center text-green-800 font-bold">
                            🚑 Service in Progress
                         </div>
                    )}

                     {/* CASE 4: Cancelled */}
                     {booking.status === 'cancelled' && (
                         <div className="bg-red-100 border border-red-300 p-4 rounded-xl text-center text-red-800 font-bold">
                            ❌ Booking Cancelled
                         </div>
                    )}
                </div>
            )}

            {/* ================= VENDOR INTERFACE ================= */}
            {isVendor && (
                <div className="mt-6 animate-fade-in space-y-4">
                    
                    {/* CASE 1: Accepted -> Verify OTP Button */}
                    {booking.status === 'accepted' && (
                        <>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <p className="text-sm text-blue-800">Reach location & verify OTP.</p>
                            </div>
                            
                            <button 
                                onClick={() => setShowOtpModal(true)}
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition"
                            >
                                🔢 Verify OTP & Start Job
                            </button>

                            <button 
                                onClick={handleCancel}
                                className="w-full bg-white border border-red-200 text-red-500 py-3 rounded-xl font-bold hover:bg-red-50"
                            >
                                Cancel Job
                            </button>
                        </>
                    )}

                    {/* CASE 2: In Progress -> Complete Job */}
                    {booking.status === 'in_progress' && (
                        <button 
                            onClick={handleCompleteJob}
                            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 active:scale-95 transition"
                        >
                            ✅ Mark Job Completed
                        </button>
                    )}
                </div>
            )}
      </div>

      {/* --- OTP POPUP MODAL --- */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all scale-100">
                <h3 className="text-xl font-bold mb-2 text-center text-gray-800">Verify Customer OTP</h3>
                <p className="text-center text-gray-500 text-sm mb-6">Enter the 4-digit code shown on customer's phone</p>
                
                <input 
                    type="number" 
                    autoFocus
                    placeholder="0000"
                    className="w-full text-center text-4xl font-mono tracking-[0.5em] border-b-2 border-indigo-200 py-3 focus:border-indigo-600 outline-none transition-colors"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                />
                
                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={() => setShowOtpModal(false)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200"
                    >
                        Close
                    </button>
                    <button 
                        onClick={handleVerifyOTP}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700"
                    >
                        Verify
                    </button>
                </div>
            </div>
        </div>
      )}

      <BottomNav />
      
    </div>
  );
};

export default BookingDetails;