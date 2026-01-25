import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import api from '../services/api'; 
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ArrowLeft, Stethoscope, MapPin, Navigation, Keyboard } from 'lucide-react';

const CompleteProfile = () => {
  // 🆕 1. ADD LOCATION MODE STATE
  const [locationMode, setLocationMode] = useState('manual'); // 'manual' | 'gps'

  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    address: '',
    serviceType: '',
    latitude: null,
    longitude: null
  });
  
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const { phone, otp, isVendor } = location.state || {};

  if (!phone || !otp) {
     navigate('/login');
     return null;
  }

  const handleChange = (e) => {
    // Agar address type kar raha hai, toh Manual mode activate karo
    if (e.target.name === 'address') {
        setLocationMode('manual');
        setFormData({ ...formData, address: e.target.value, latitude: null, longitude: null });
    } else {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleServiceChange = (value) => {
    setFormData({ ...formData, serviceType: value });
  };

  // === 📍 2. GPS LOCATION (Updated Logic) ===
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
        return toast.error("Geolocation is not supported by your browser");
    }

    setLocationMode('gps'); // Switch to GPS mode
    setLocationLoading(true);

    const geoOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
                // Reverse Geocoding to show text
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`
                );
                const data = await response.json();
                
                setFormData(prev => ({
                    ...prev,
                    address: data.display_name,
                    latitude: latitude,
                    longitude: longitude
                }));
                toast.success("Exact location locked!");
            } catch (error) {
                // Agar address text fail hua, coordinates toh mil gaye na
                setFormData(prev => ({ ...prev, latitude, longitude }));
                toast.success("GPS Coordinates Locked!");
            } finally {
                setLocationLoading(false);
            }
        },
        (error) => {
            setLocationLoading(false);
            setLocationMode('manual'); // Fallback
            if (error.code === 1) toast.error("Please allow location access.");
            else toast.error("GPS signal weak. Switching to Manual.");
        },
        geoOptions
    );
  };

  // === 🗺️ 3. SMART GEOCODING (Fix for 'Balajinagar, Pune') ===
  const getCoordinatesFromAddress = async (addressText) => {
      try {
          // Trick: Agar user ne 'India' nahi likha, toh hum jod dete hain
          // Isse 'Balajinagar' Telangana wala nahi, balki Pune wala milega agar context sahi ho
          const query = addressText.toLowerCase().includes('india') ? addressText : `${addressText}, India`;
          
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
          const response = await fetch(url);
          const data = await response.json();
          
          if (data && data.length > 0) {
              return {
                  lat: parseFloat(data[0].lat),
                  lon: parseFloat(data[0].lon)
              };
          }
          return null;
      } catch (error) {
          console.error("Geocoding failed", error);
          return null;
      }
  };

  // === 🚀 4. HANDLE REGISTER ===
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.address) return toast.error("Fill all details");

    setLoading(true);
    let finalLat = formData.latitude;
    let finalLng = formData.longitude;

    // Logic: Agar Manual Mode hai ya Coordinates missing hain -> Geocode karo
    if (locationMode === 'manual' || !finalLat || !finalLng) {
        toast("📍 Validating address...", { icon: '🔍' });
        const coords = await getCoordinatesFromAddress(formData.address);
        
        if (coords) {
            finalLat = coords.lat;
            finalLng = coords.lon;
        } else {
            setLoading(false);
            return toast.error("Address not found! Try adding City name (e.g. Balajinagar, Pune)");
        }
    }

    try {
      const endpoint = isVendor ? '/auth/register-vendor' : '/auth/register-user';
      
      const response = await api.post(endpoint, { 
          ...formData, 
          latitude: finalLat, 
          longitude: finalLng, 
          phone, 
          otp 
      });

      if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          toast.success(`Welcome, ${formData.name}!`);
          
          if (isVendor) {
              navigate('/profile');
          } else {
              navigate('/book-service');
          }
      } else {
          toast.success("Registration Successful! Please Login.");
          navigate('/login');
      }

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
       <Toaster position="top-center" />

       <div className={`px-6 pt-8 pb-4 ${isVendor ? 'bg-green-50' : 'bg-white'}`}>
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-200/50">
                <ArrowLeft className="w-6 h-6 text-slate-800" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900 mt-4">
                {isVendor ? "Partner Registration" : "Complete Profile"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
                {isVendor ? "Join us to save lives" : "Few details to get started"}
            </p>
       </div>

       <div className="flex-1 px-6 pt-6 pb-6 overflow-y-auto">
            <form onSubmit={handleRegister} className="flex flex-col gap-5">
                
                {isVendor && (
                    <div className="space-y-2">
                        <Label className="text-green-700 font-bold flex items-center gap-2">
                            <Stethoscope className="w-4 h-4" /> Service Type
                        </Label>
                        <Select onValueChange={handleServiceChange}>
                            <SelectTrigger className="h-14 bg-white border-green-200 rounded-xl text-lg">
                                <SelectValue placeholder="Select Profession" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="doctor">Doctor</SelectItem>
                                <SelectItem value="nurse">Nurse</SelectItem>
                                <SelectItem value="ambulance">Ambulance Driver</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Full Name</Label>
                    <Input 
                        name="name" 
                        placeholder={isVendor ? "Dr. Name" : "Your Name"} 
                        className="h-14 bg-slate-50 border-slate-200 rounded-xl"
                        onChange={handleChange}
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Email Address</Label>
                    <Input 
                        name="email" 
                        type="email"
                        placeholder="email@example.com" 
                        className="h-14 bg-slate-50 border-slate-200 rounded-xl"
                        onChange={handleChange}
                    />
                </div>

                {/* === 📍 NEW LOCATION UI WITH TOGGLE === */}
                <div className="space-y-2">
                    <Label className="text-slate-700 font-medium flex justify-between">
                        {isVendor ? "Clinic Location" : "Home Address"}
                    </Label>

                    {/* TOGGLE SWITCH */}
                    <div className="flex bg-slate-100 p-1 rounded-lg mb-2">
                        <button
                            type="button"
                            onClick={() => {
                                setLocationMode('manual');
                                setFormData({ ...formData, latitude: null, longitude: null }); // Reset coords
                            }}
                            className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${locationMode === 'manual' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
                        >
                            <Keyboard className="w-3 h-3" /> Manual Entry
                        </button>
                        <button
                            type="button"
                            onClick={handleCurrentLocation}
                            className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${locationMode === 'gps' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400'}`}
                        >
                            {locationLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />} Detect GPS
                        </button>
                    </div>
                    
                    {/* INPUT FIELD */}
                    <div className="relative">
                        <Input 
                            name="address" 
                            value={formData.address}
                            placeholder={locationMode === 'gps' ? "Detecting location..." : "e.g. Balajinagar, Pune"} 
                            className={`h-14 bg-slate-50 border-slate-200 rounded-xl ${locationMode === 'gps' ? 'text-green-700 font-medium' : ''}`}
                            onChange={handleChange}
                        />
                        {/* Status Icon inside Input */}
                        {locationMode === 'gps' && !locationLoading && formData.latitude && (
                            <div className="absolute right-3 top-4 text-green-600">
                                <MapPin className="w-5 h-5" />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 px-1">
                         <span>
                            {locationMode === 'gps' && formData.latitude ? '✅ GPS Locked Successfully' : '✍️ We will find this location on map'}
                         </span>
                    </div>
                </div>

                <div className="mt-8">
                    <Button 
                        type="submit" 
                        className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all ${isVendor ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-blue-700'}`}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Register"}
                    </Button>
                </div>

            </form>
       </div>
    </div>
  );
};

export default CompleteProfile;