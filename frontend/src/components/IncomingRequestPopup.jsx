import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import toast from 'react-hot-toast';
import { MapPin, User } from 'lucide-react';

const IncomingRequestPopup = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // 🛑 FIX: Tera Controller 'new_request' bhej raha hai (Underscore wala)
    const handleNewRequest = (data) => {
      console.log("🔔 POPUP TRIGGERED:", data); // Ye console zaroor check karna
      setRequest(data);
      setTimeLeft(30); 
      
      // Sound Play
      try {
        const audio = new Audio('/notification.mp3'); 
        audio.play().catch(e => console.log("Audio play error:", e));
      } catch (e) {}
    };

    socket.on('new_request', handleNewRequest);

    return () => {
      socket.off('new_request', handleNewRequest);
    };
  }, [socket]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let timer;
    if (request && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && request) {
      handleDecline(); 
      toast.error("Request Missed (Timeout)");
    }
    return () => clearInterval(timer);
  }, [request, timeLeft]);

  const handleDecline = () => setRequest(null);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await api.patch('/booking/accept', { bookingId: request.bookingId });
      if (res.data.success) {
        toast.success("Booking Accepted!");
        setRequest(null);
        navigate('/vendor/track-job', { state: { booking: res.data.booking } });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Accept Failed");
      setRequest(null);
    } finally {
      setLoading(false);
    }
  };

  if (!request) return null;

  // --- UI PART ---
  const progressPercent = (timeLeft / 30) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border-2 border-primary/20 relative animate-in slide-in-from-bottom-10">
        
        {/* HEADER */}
        <div className="bg-primary px-5 py-4 flex justify-between items-center text-white">
            <h3 className="font-black text-lg">NEW REQUEST</h3>
            <div className="bg-white/20 px-2 py-1 rounded text-xs font-mono font-bold">
               00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </div>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">
            <div className="text-center">
                <h2 className="text-2xl font-black text-slate-800 uppercase">{request.serviceType} Needed</h2>
                <p className="text-slate-500 text-xs font-bold">Total Fare: ₹{request.fare?.estimated || '0'}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3 border border-slate-100">
                <div className="bg-blue-100 p-2 rounded-full"><User className="w-5 h-5 text-primary" /></div>
                <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Patient</p>
                    <p className="text-sm font-bold text-slate-800">{request.patientName}</p>
                </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3 border border-slate-100">
                <div className="bg-green-100 p-2 rounded-full"><MapPin className="w-5 h-5 text-green-600" /></div>
                <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Location</p>
                    <p className="text-sm font-medium text-slate-700 line-clamp-2">{request.location}</p>
                </div>
            </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="h-1.5 w-full bg-slate-100">
            <div className="h-full bg-red-500 transition-all duration-1000 ease-linear" style={{ width: `${progressPercent}%` }}></div>
        </div>

        {/* BUTTONS */}
        <div className="p-4 grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleDecline} className="h-12 font-bold">Decline</Button>
            <Button onClick={handleAccept} disabled={loading} className="h-12 bg-green-600 hover:bg-green-700 text-white font-bold">
                {loading ? "Accepting..." : "ACCEPT NOW"}
            </Button>
        </div>

      </div>
    </div>
  );
};

export default IncomingRequestPopup;