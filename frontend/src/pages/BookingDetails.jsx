import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../services/api'; // 👈 Use your configured API instance
import BookingStatusStepper from '../components/BookingStatusStepper';
import BottomNav from '../components/layout/BottomNav';
import toast from 'react-hot-toast'; // Alerts ki jagah Toast use karo

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Booking Data & Set User
  const fetchBooking = async () => {
    try {
      // 🛑 FIX 1: LocalStorage Key Check (User ya UserInfo dono check karo)
      const storedUser = localStorage.getItem('user') || localStorage.getItem('userInfo');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      setCurrentUser(parsedUser);

      // API Call
      const res = await axios.get(`/booking/${id}`); // api.js use kar rahe ho to full path mat likho
      setBooking(res.data.booking);
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooking(); }, [id]);

  // --- ACTIONS ---

  const handleVerifyOTP = async () => {
    try {
      await axios.post('/booking/start-job', { bookingId: id, otp: otpInput });
      toast.success('OTP Verified! Job Started.'); 
      setShowOtpModal(false);
      fetchBooking(); // Refresh data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    }
  };

  const handleCompleteJob = async () => {
    try {
      await axios.post('/booking/complete-job', { 
        bookingId: id, 
        finalAmount: booking.fare.estimated, 
        paymentMode: 'cash' 
      });
      toast.success('Job Completed Successfully!');
      fetchBooking();
    } catch (err) {
      toast.error('Error completing job');
    }
  };

  const handleCancel = async () => {
      if(!window.confirm("Are you sure you want to cancel this booking?")) return;
      try {
        await axios.put('/booking/cancel', { bookingId: id, reason: 'User requested cancellation' });
        toast.success('Booking Cancelled');
        fetchBooking();
      } catch (error) {
        toast.error('Error cancelling booking');
      }
  };

  if (loading) return <div className="flex h-screen justify-center items-center text-primary">Loading Details...</div>;
  if (!booking) return <div className="p-10 text-center text-red-500">Booking not found.</div>;

  // ============================================================
  // 👇 ROBUST MATCHING LOGIC (Senior Dev Style)
  // ============================================================
  
  // Helper to safely get ID string
  const getID = (obj) => {
    if (!obj) return null;
    return typeof obj === 'string' ? obj : obj._id;
  };

  const currentUserId = getID(currentUser);
  const customerId = getID(booking.customer);
  const vendorId = getID(booking.vendor);

  // String comparison to avoid ObjectId object mismatch
  const isUser = currentUserId && customerId && String(currentUserId) === String(customerId);
  const isVendor = currentUserId && vendorId && String(currentUserId) === String(vendorId);

  // Debug Logs (Console mein dekhna agar ab bhi na dikhe)
  console.log(`Matching Logic: UserID(${currentUserId}) vs CustomerID(${customerId}) -> Match? ${isUser}`);

  return (
    <div className="pb-24 bg-gray-50 min-h-screen font-sans">
      
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="text-lg font-bold text-gray-800">Booking #{booking._id.slice(-6).toUpperCase()}</h1>
      </div>

      <div className="max-w-md mx-auto p-4 animate-fade-in">
            
            {/* Status Bar */}
            <BookingStatusStepper status={booking.status} />
            
            {/* Main Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mt-4 space-y-4">
                
                {/* Service Info */}
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Service</span>
                        <h2 className="text-2xl font-bold text-gray-800">{booking.serviceType}</h2>
                        {booking.patientDetails && (
                            <p className="text-sm text-gray-500 mt-1">
                                For: {booking.patientDetails.name} <span className='text-xs bg-gray-100 px-2 py-0.5 rounded-full'>{booking.patientDetails.gender}</span>
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Price</span>
                        <p className="text-xl font-bold text-green-600">₹{booking.fare?.estimated || 0}</p>
                        <p className="text-[10px] text-gray-400 uppercase">{booking.payment?.mode || 'Cash'}</p>
                    </div>
                </div>

                <hr className="border-dashed border-gray-200" />

                {/* Location */}
                <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Location</span>
                    <p className="text-gray-700 font-medium mt-1 text-sm leading-relaxed">📍 {booking.location?.address}</p>
                </div>
            </div>

            {/* ================= USER INTERFACE ================= */}
            {isUser && (
                <div className="mt-6">
                    
                    {/* CASE 1: Pending */}
                    {(booking.status === 'pending' || booking.status === 'queued') && (
                        <div className="space-y-3">
                             <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-yellow-800 text-xs flex items-center gap-2">
                                <span className="animate-pulse">⏳</span> Searching for nearby vendors...
                             </div>
                             <div className="flex gap-3">
                                <button onClick={handleCancel} className="flex-1 py-3 border border-red-200 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition">Cancel Request</button>
                                {/* Edit logic yahan connect karna padega */}
                                <button onClick={() => navigate('/book-service', { state: { existingData: booking, editMode: true } })} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition">Edit Details</button>
                             </div>
                        </div>
                    )}

                    {/* CASE 2: Accepted -> SHOW OTP */}
                    {booking.status === 'accepted' && (
                        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 rounded-2xl shadow-lg text-center mt-4">
                            <p className="text-[10px] font-bold opacity-80 mb-3 tracking-widest uppercase">Share OTP with Vendor</p>
                            <div className="bg-white text-blue-600 text-4xl font-mono font-black tracking-[0.2em] py-4 rounded-xl shadow-sm mb-3 select-all">
                                {booking.otp?.code || '----'}
                            </div>
                            <div className="flex items-center justify-center gap-2 text-xs opacity-90">
                                <span>Vendor arriving:</span>
                                <span className="font-bold bg-white/20 px-2 py-0.5 rounded">{booking.vendor?.name}</span>
                            </div>
                        </div>
                    )}

                    {/* CASE 3: In Progress */}
                    {booking.status === 'in_progress' && (
                         <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-center text-green-700 font-bold text-sm mt-4">
                            🚑 Service is currently in progress
                         </div>
                    )}
                </div>
            )}

            {/* ================= VENDOR INTERFACE ================= */}
            {isVendor && (
                <div className="mt-6 space-y-4">
                    
                    {/* CASE 1: Accepted -> Verify OTP Button */}
                    {booking.status === 'accepted' && (
                        <>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                                ℹ️ Please reach the location and ask the customer for the OTP to start the job.
                            </div>
                            
                            <button 
                                onClick={() => setShowOtpModal(true)}
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition"
                            >
                                🔢 Enter OTP & Start
                            </button>

                            <button 
                                onClick={handleCancel}
                                className="w-full bg-white border border-red-200 text-red-500 py-3 rounded-xl font-bold text-sm hover:bg-red-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm">
                <h3 className="text-xl font-bold mb-2 text-center text-gray-800">Verify OTP</h3>
                <p className="text-center text-gray-500 text-xs mb-6">Ask customer for the 4-digit code</p>
                
                <input 
                    type="number" 
                    autoFocus
                    placeholder="0000"
                    className="w-full text-center text-4xl font-mono tracking-[0.5em] border-b-2 border-indigo-200 py-3 focus:border-indigo-600 outline-none transition-colors mb-8"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                />
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowOtpModal(false)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200"
                    >
                        Close
                    </button>
                    <button 
                        onClick={handleVerifyOTP}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700"
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