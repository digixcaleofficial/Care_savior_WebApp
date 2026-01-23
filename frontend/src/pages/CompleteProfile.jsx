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
import { Loader2, ArrowLeft, Stethoscope, MapPin, Navigation } from 'lucide-react';

const CompleteProfile = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    address: '',
    serviceType: '',
    latitude: null,  // 👈 Coordinates save karne ke liye
    longitude: null
  });
  
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false); // Location fetch loader
  
  const navigate = useNavigate();
  const location = useLocation();

  const { phone, otp, isVendor } = location.state || {};

  if (!phone || !otp) {
     navigate('/login');
     return null;
  }

  const handleChange = (e) => {
    // Agar user manual edit kar raha hai, toh purane coordinates hata do
    if (e.target.name === 'address') {
        setFormData({ ...formData, address: e.target.value, latitude: null, longitude: null });
    } else {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleServiceChange = (value) => {
    setFormData({ ...formData, serviceType: value });
  };

  // === 📍 FEATURE 1: GET CURRENT LOCATION (GPS) ===
// === 📍 1. GPS LOCATION: HIGH ACCURACY FIX ===
// === 📍 1. GPS LOCATION: HIGH ACCURACY FIX ===
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
        return toast.error("Geolocation is not supported by your browser");
    }

    setLocationLoading(true);

    const geoOptions = {
        enableHighAccuracy: true, // 👈 Satellite GPS ko trigger karega
        timeout: 10000,           // 10 seconds tak wait karega
        maximumAge: 0             // Purani cached location use nahi karega
    };

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
                // Address fetch karte waqt zoom level 18 (Exact building level) rakha hai
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
                toast.error("Connected to GPS but failed to fetch address text.");
            } finally {
                setLocationLoading(false);
            }
        },
        (error) => {
            setLocationLoading(false);
            if (error.code === 1) toast.error("Please allow location access in your browser settings.");
            else toast.error("GPS signal weak. Move near a window or type manually.");
        },
        geoOptions
    );
  };

  // === 🗺️ 2. MANUAL ENTRY: REFINED GEOCODING ===
  const getCoordinatesFromAddress = async (addressText) => {
      try {
          // India bias add kiya hai aur search limit 1 rakhi hai
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressText)}&countrycodes=in&limit=1`;
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

  // === 🚀 3. UPDATED REGISTRATION LOGIC ===
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.address) return toast.error("Fill all details");

    setLoading(true);
    let finalLat = formData.latitude;
    let finalLng = formData.longitude;

    if (!finalLat || !finalLng) {
        toast("📍 Locating address...", { icon: '🗺️' });
        const coords = await getCoordinatesFromAddress(formData.address);
        if (coords) {
            finalLat = coords.lat;
            finalLng = coords.lon;
        } else {
            setLoading(false);
            return toast.error("Could not find address on map! Please click the blue Arrow Icon for GPS.");
        }
    }

    try {
      const endpoint = isVendor ? '/auth/register-vendor' : '/auth/register-user';
      await api.post(endpoint, { ...formData, latitude: finalLat, longitude: finalLng, phone, otp });
      toast.success(`Welcome!`);
      navigate('/'); 
    } catch (error) {
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
                                <SelectItem value="lab">Lab Technician</SelectItem>
                                <SelectItem value="pharmacist">Pharmacist</SelectItem>
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

                {/* === LOCATION FIELD WITH AUTO DETECT === */}
                <div className="space-y-2">
                    <Label className="text-slate-700 font-medium flex justify-between">
                        {isVendor ? "Clinic Location" : "Home Address"}
                        
                        {/* Status Indicator */}
                        {formData.latitude && (
                            <span className="text-[10px] text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Location Locked
                            </span>
                        )}
                    </Label>
                    
                    <div className="relative">
                        <Input 
                            name="address" 
                            value={formData.address}
                            placeholder="e.g. Pune, Maharashtra" 
                            className="h-14 bg-slate-50 border-slate-200 rounded-xl pr-12" // Padding right for icon
                            onChange={handleChange}
                        />
                        {/* Auto Detect Icon Button */}
                        <button 
                            type="button"
                            onClick={handleCurrentLocation}
                            disabled={locationLoading}
                            className="absolute right-2 top-2 h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-primary hover:bg-blue-50 shadow-sm transition-all"
                            title="Use Current Location"
                        >
                            {locationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                        Tap the arrow icon to fetch current GPS location automatically.
                    </p>
                </div>

                <div className="mt-8">
                    <Button 
                        type="submit" 
                        className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all ${isVendor ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-blue-700'}`}
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