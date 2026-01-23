import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from '../services/api'; 
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronDown, Stethoscope } from 'lucide-react'; // Icon add kiya

const Login = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  // 👇 1. Ye State Add kiya
  const [isVendor, setIsVendor] = useState(false); 

  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return toast.error("Please enter valid phone number");
    
    setLoading(true);
    try {
      // OTP send karte waqt role matter nahi karta, bas phone chahiye
      await api.post('/auth/send-otp', { phone });
      toast.success(`OTP sent to ${phone}`);
      
      // 👇 2. Yahan 'isVendor' pass kar rahe hain agle page ko
      navigate('/verify-otp', { state: { phone, isVendor } });
      
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      <Toaster position="top-center" />

      {/* Blue Header (Color change for Vendor to differentiate) */}
      <div className={`absolute top-[-15%] left-[-20%] w-[140%] h-[55%] rounded-b-[100%] z-0 transition-colors duration-500 ${isVendor ? 'bg-green-600' : 'bg-primary'}`}></div>

      <div className="z-10 flex-1 flex flex-col px-6 w-full max-w-md mx-auto pt-32"></div>

      <div className="z-20 w-full max-w-md mx-auto px-6 pb-10 bg-white/0">
        
        {/* Title to show current mode */}
        <h2 className="text-center font-bold text-2xl mb-6 text-slate-800">
            {isVendor ? "Partner Login" : "User Login"}
        </h2>

        <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
           
           <div className="flex gap-3">
              <div className="flex items-center justify-center px-4 h-14 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-700 font-bold min-w-[90px]">
                 <img src="https://flagcdn.com/w40/in.png" alt="IN" className="w-6 h-auto mr-2 rounded-sm"/>
                 <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 relative">
                  <span className="absolute left-4 top-4 text-slate-500 font-medium text-lg">+91</span>
                  <Input 
                      placeholder="99999 99999" 
                      className="h-14 pl-14 text-xl font-medium bg-white border-slate-200 rounded-xl shadow-sm focus:border-primary focus:ring-0"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      type="tel"
                      maxLength={10}
                      autoFocus
                  />
              </div>
           </div>

           <Button type="submit" className={`h-14 text-lg font-bold rounded-xl shadow-lg mt-2 transition-colors ${isVendor ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-blue-700'}`}>
              {loading ? <Loader2 className="animate-spin" /> : "Receive OTP"}
           </Button>

           <div className="relative flex items-center justify-center py-4">
              <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-4 text-sm font-medium text-slate-400">or</span>
           </div>
           
           {/* 👇 3. VENDOR TOGGLE BUTTON */}
           <button 
                type="button"
                onClick={() => { setIsVendor(!isVendor); setPhone(''); }}
                className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors py-2"
           >
                {isVendor ? (
                    <>Login as a Patient / User</>
                ) : (
                    <><Stethoscope className="w-4 h-4" /> Are you a Doctor/Partner? Login Here</>
                )}
           </button>

        </form>
      </div>
    </div>
  );
};

export default Login;