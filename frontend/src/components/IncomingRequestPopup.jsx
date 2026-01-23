import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import toast from 'react-hot-toast';
import { MapPin, User, Clock, AlertCircle } from 'lucide-react';

const IncomingRequestPopup = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null); // Request data store karega
  const [timeLeft, setTimeLeft] = useState(30); // 30 Seconds ka timer
  const [loading, setLoading] = useState(false);

  // 🔔 1. LISTENER: Socket se 'new_request' ka wait karo
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (data) => {
      console.log("🔔 New Booking Request:", data);
      setRequest(data); // Popup show karne ke liye data set karo
      setTimeLeft(30);  // Timer reset karo
      
      // Optional: Sound play kar sakte ho yahan (Tring Tring)
      // const audio = new Audio('/ringtone.mp3');
      // audio.play();
    };

    socket.on('new_request', handleNewRequest);

    return () => {
      socket.off('new_request', handleNewRequest);
    };
  }, [socket]);

  // ⏳ 2. TIMER LOGIC: 30s Countdown
  useEffect(() => {
    let timer;
    if (request && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && request) {
      // Time Khatam! Popup close karo
      handleDecline(); 
      toast.error("Request Missed (Timeout)");
    }
    return () => clearInterval(timer);
  }, [request, timeLeft]);

  // Actions
  const handleDecline = () => {
    setRequest(null); // Popup hide
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await api.patch('/booking/accept', { bookingId: request.bookingId });
      
      if (res.data.success) {
        toast.success("Booking Accepted!");
        setRequest(null); // Popup hide
        // Vendor ko Tracking Page par le jao (jahan OTP dalna hai)
        navigate('/vendor/track-job', { state: { booking: res.data.booking } });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Accept Failed");
      setRequest(null);
    } finally {
      setLoading(false);
    }
  };

  // Agar koi request nahi hai, toh kuch mat dikhao (Hidden)
  if (!request) return null;

  // Progress Bar Percentage calculation
  const progressPercent = (timeLeft / 30) * 100;

  return (
    // FULL SCREEN OVERLAY (Z-Index High rakha hai taaki sabke upar dikhe)
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      
      {/* POPUP CARD */}
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border-2 border-primary/20 relative animate-in slide-in-from-bottom-10">
        
        {/* HEADER: New Request */}
        <div className="bg-primary px-5 py-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <h3 className="font-black text-lg tracking-wide">NEW REQUEST</h3>
            </div>
            <div className="bg-white/20 px-2 py-1 rounded text-xs font-mono font-bold">
                00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </div>
        </div>

        {/* BODY: Details */}
        <div className="p-6 space-y-4">
            
            {/* Service Type */}
            <div className="text-center">
                <h2 className="text-2xl font-black text-slate-800 uppercase">{request.serviceType} Needed</h2>
                <p className="text-slate-500 text-xs font-bold">Total Fare: ₹{request.fare?.estimated || 'Calculating...'}</p>
            </div>

            {/* Patient Info */}
            <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3 border border-slate-100">
                <div className="bg-blue-100 p-2 rounded-full">
                    <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Patient</p>
                    <p className="text-sm font-bold text-slate-800">{request.patientName}</p>
                </div>
            </div>

            {/* Location Info */}
            <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3 border border-slate-100">
                <div className="bg-green-100 p-2 rounded-full">
                    <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Pick Up Location</p>
                    <p className="text-sm font-medium text-slate-700 line-clamp-2 leading-tight">
                        {request.location}
                    </p>
                </div>
            </div>
        </div>

        {/* PROGRESS BAR (Time Running Out) */}
        <div className="h-1.5 w-full bg-slate-100">
            <div 
                className="h-full bg-red-500 transition-all duration-1000 ease-linear" 
                style={{ width: `${progressPercent}%` }}
            ></div>
        </div>

        {/* FOOTER: Buttons */}
        <div className="p-4 grid grid-cols-2 gap-3">
            <Button 
                variant="outline" 
                onClick={handleDecline} 
                className="h-12 rounded-xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50"
            >
                Decline
            </Button>
            <Button 
                onClick={handleAccept} 
                disabled={loading}
                className="h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg shadow-green-200"
            >
                {loading ? "Accepting..." : "ACCEPT NOW"}
            </Button>
        </div>

      </div>
    </div>
  );
};

export default IncomingRequestPopup;