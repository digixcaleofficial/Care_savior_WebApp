import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from '../services/api'; 
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Edit2 } from 'lucide-react';

const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // 👇 1. Pichle page se 'isVendor' bhi uthaya
  const { phone, isVendor } = location.state || {};

  if (!phone) {
     navigate('/login');
     return null;
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 4) return toast.error("Enter valid OTP");

    setLoading(true);
    try {
      // 👇 2. Backend ko sahi role bheja
      const role = isVendor ? 'vendor' : 'user';
      
      const response = await api.post('/auth/verify-otp', { phone, otp, role });
      const data = response.data;

      if (data.isNewUser) {
        toast.success(`Verified! Registering as ${role}...`);
        
        // 👇 3. Register page ko bhi batao ki ye Vendor hai
        navigate('/complete-profile', { state: { phone, otp, isVendor } });
        
      } else if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user || data.vendor));
        
        toast.success("Welcome back!");

        // Vendor ka dashboard alag ho sakta hai, abhi ke liye home
        navigate(from, { replace: true });
      }

    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      <Toaster position="top-center" />
      {/* Vendor ke liye Green theme, User ke liye Blue */}
      <div className={`absolute top-[-20%] left-[-20%] w-[140%] h-[60%] rounded-b-[100%] z-0 ${isVendor ? 'bg-green-600' : 'bg-primary'}`}></div>

      <div className="z-10 flex-1 flex flex-col px-6 w-full max-w-md mx-auto pt-32"></div>

      <div className="z-20 w-full max-w-md mx-auto px-6 pb-10 mt-10">
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Verify {isVendor ? "Partner" : ""} OTP</h2>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span>Sent to +91 {phone}</span>
                <button onClick={() => navigate('/login')} className="text-primary p-1 rounded"><Edit2 className="w-4 h-4" /></button>
            </div>
        </div>

        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
            <Input 
                placeholder="• • • •" 
                className="h-16 text-center text-4xl tracking-[0.5em] font-bold bg-white border-slate-300 rounded-xl focus:border-primary shadow-sm"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={4}
                autoFocus
                type="tel"
            />
            <Button type="submit" className={`h-14 text-lg font-bold rounded-xl shadow-lg mt-4 ${isVendor ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-blue-700'}`}>
               {loading ? <Loader2 className="animate-spin" /> : "Verify & Continue"}
            </Button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;