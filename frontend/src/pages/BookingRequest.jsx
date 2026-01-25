import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import api from '../services/api'; 
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, Stethoscope, Ambulance, Pill, MapPin, Loader2, Minus, Maximize2, Navigation, Keyboard } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';

const BookingRequest = () => {
    const navigate = useNavigate();
    const { socket } = useSocket();
    const location = useLocation();
    const { addNotification } = useNotifications();

    const isEditMode = location.state?.editMode || false;
    const existingData = location.state?.existingData || null;
    const preSelectedService = location.state?.service || 'Doctor';

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [bookingId, setBookingId] = useState(null);
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    
    // 🆕 NEW STATES FOR RADAR & LOCATION TOGGLE
    const [vendorCount, setVendorCount] = useState(0);
    const [isMinimized, setIsMinimized] = useState(false);
    const [locationMode, setLocationMode] = useState('manual'); // 'manual' | 'gps'

    const [formData, setFormData] = useState({
        serviceType: preSelectedService,
        patientName: '',
        patientAge: '',
        patientGender: 'Male',
        patientPhone: '',
        patientProblem: '',
        address: '',
        latitude: null,
        longitude: null
    });

    // ✅ HELPER: Convert Address String to Coordinates (Geocoding)
    const getCoordinatesFromAddress = async (addressText) => {
        try {
            // Trick: Add 'India' context for better results
            const query = addressText.toLowerCase().includes('india') ? addressText : `${addressText}, India`;
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon),
                    displayName: data[0].display_name
                };
            }
            return null;
        } catch (error) {
            console.error("Geocoding failed:", error);
            return null;
        }
    };

    // ✅ 1. GPS Logic (Only runs when User clicks 'Detect')
    const getUserLocation = () => {
        setIsLocationLoading(true);
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported");
            setIsLocationLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                console.log("📍 GPS Success:", latitude, longitude);
                
                // Reverse Geocode to show address text
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    
                    setFormData(prev => ({
                        ...prev,
                        latitude: latitude,
                        longitude: longitude,
                        address: data.display_name || prev.address // Auto-fill text
                    }));
                } catch (e) {
                    // Fallback if reverse fails
                    setFormData(prev => ({ ...prev, latitude, longitude }));
                }

                setIsLocationLoading(false);
                toast.success("GPS Locked Successfully!");
            },
            (err) => {
                console.warn("⚠️ GPS Failed:", err.message);
                setIsLocationLoading(false);
                toast.error("GPS Timeout. Switching to Manual.");
                setLocationMode('manual'); // Fallback to manual
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    // ✅ 2. Handle Location Mode Switch
    const handleLocationModeChange = (mode) => {
        setLocationMode(mode);
        if (mode === 'gps') {
            getUserLocation();
        } else {
            // Reset coords to force geocoding from text
            setFormData(prev => ({ ...prev, latitude: null, longitude: null }));
        }
    };

    // ✅ 3. Initialization
    useEffect(() => {
        if (isEditMode && existingData) {
            setFormData({
                serviceType: existingData.serviceType,
                patientName: existingData.patientDetails?.name || '',
                patientAge: existingData.patientDetails?.age || '',
                patientGender: existingData.patientDetails?.gender || 'Male',
                patientPhone: existingData.patientDetails?.phone || '',
                patientProblem: existingData.patientDetails?.problemDescription || '',
                address: existingData.location?.address || '',
                latitude: existingData.location?.coordinates?.[1] || null, 
                longitude: existingData.location?.coordinates?.[0] || null
            });
            setBookingId(existingData._id);
            setLocationMode('manual'); // Default to manual on edit
        } else {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.address) {
                setFormData(prev => ({ ...prev, address: user.address }));
            }
        }
    }, [isEditMode, existingData]);

    // Socket Listener
    useEffect(() => {
        if (!socket) return;
        const handleAccept = (data) => {
            console.log("Booking Accepted!", data);
            toast.success(`Accepted by ${data.vendorName}!`);
            navigate('/booking-track', { state: { booking: data } });
        };
        socket.on('booking_accepted', handleAccept);
        return () => socket.off('booking_accepted', handleAccept);
    }, [socket, navigate]);

    // ✅ 4. SUBMIT LOGIC (The Main Fix)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let finalLat = formData.latitude;
        let finalLng = formData.longitude;

        // 🛑 MANUAL MODE LOGIC:
        // Agar Manual Mode hai, ya Coordinates missing hain -> Geocode karo
        if (locationMode === 'manual' || !finalLat || !finalLng) {
            if (!formData.address) {
                setLoading(false);
                return toast.error("Please enter a location address.");
            }

            toast("📍 Locating address...", { icon: '🔍' });
            const coords = await getCoordinatesFromAddress(formData.address);
            
            if (coords) {
                finalLat = coords.lat;
                finalLng = coords.lon;
                setFormData(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lon }));
            } else {
                setLoading(false);
                return toast.error("Address not found! Try adding City/Area name.");
            }
        }

        try {
             // 🟢 CREATE FLOW (POST)
             const res = await api.post('/booking/create', {
                ...formData,
                latitude: finalLat,
                longitude: finalLng,
                scheduledDate: new Date()
            });

            if (res.data.success) {
                setBookingId(res.data.bookingId);
                
                // 🔢 CAPTURE VENDOR COUNT (Backend se aana chahiye)
                const count = res.data.nearbyVendorsCount || 0; 
                setVendorCount(count);
                
                setStep(2); // Show Radar
                addNotification({
                    title: "Request Sent",
                    message: `Sent to ${count} nearby partners`,
                    type: 'success',
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Operation Failed");
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // 📡 RADAR SCREEN (STEP 2) - FIXED UI
    // ==========================================
    if (step === 2) {
        // 🔽 MINIMIZED VIEW
        if (isMinimized) {
            return (
                <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
                    <div className="bg-white p-4 rounded-xl shadow-2xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">Finding {formData.serviceType}...</h4>
                                <p className="text-xs text-slate-500 font-bold text-green-600">
                                    • Contacting {vendorCount} Partners
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsMinimized(false)}
                            className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            <Maximize2 className="w-5 h-5 text-slate-700" />
                        </button>
                    </div>
                </div>
            );
        }

        // 🔼 FULL SCREEN VIEW
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center p-6 relative">
                
                {/* Minimize Button */}
                <button 
                    onClick={() => setIsMinimized(true)}
                    className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-all"
                >
                    <Minus className="w-6 h-6" />
                </button>

                <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
                    <span className="absolute w-full h-full rounded-full bg-blue-500 opacity-10 animate-ping duration-1000"></span>
                    <span className="absolute w-32 h-32 rounded-full bg-blue-500 opacity-20 animate-pulse delay-75"></span>
                    <div className="relative z-10 bg-white p-2 rounded-full shadow-lg">
                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    </div>
                </div>

                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Finding Provider</h2>
                
                <div className="mt-4 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 inline-block">
                    <p className="text-blue-800 font-medium text-sm">
                        Request sent to <span className="font-black text-xl">{vendorCount}</span> nearby {formData.serviceType}s
                    </p>
                </div>

                <p className="text-slate-400 mt-8 text-xs font-mono">BOOKING ID: {bookingId}</p>
                
                <Button variant="ghost" className="mt-6 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => navigate('/')}>
                    Cancel Request
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-10 font-sans">
            <Toaster position="top-center" />
            <div className="bg-white px-5 pt-6 pb-4 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)}><ArrowLeft className="w-6 h-6 text-slate-700" /></button>
                    <h1 className="text-xl font-bold text-slate-800">
                        {isEditMode ? "Update Request" : "Request Service"}
                    </h1>
                </div>
            </div>

            <div className="p-5 space-y-6">
                {/* Service Selector */}
                <div className="grid grid-cols-3 gap-3">
                    {['Doctor', 'Nurse', 'Ambulance'].map((type) => (
                        <div
                            key={type}
                            onClick={() => !isEditMode && setFormData({ ...formData, serviceType: type })}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer 
                            ${formData.serviceType === type ? 'border-primary bg-blue-50 text-primary' : 'border-white bg-white text-slate-400'}
                            ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''} 
                            `}
                        >
                            {type === 'Doctor' && <Stethoscope className="mb-1" />}
                            {type === 'Nurse' && <Pill className="mb-1" />}
                            {type === 'Ambulance' && <Ambulance className="mb-1" />}
                            <span className="text-xs font-bold">{type}</span>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Patient Details */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800 border-b pb-2 mb-2">Patient Details</h3>
                        <div>
                            <Label>Patient Name</Label>
                            <Input value={formData.patientName} onChange={(e) => setFormData({ ...formData, patientName: e.target.value })} required />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Label>Age</Label>
                                <Input type="number" value={formData.patientAge} onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })} required />
                            </div>
                            <div className="flex-1">
                                <Label>Gender</Label>
                                <select className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white" value={formData.patientGender} onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })}>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label>Contact Number</Label>
                            <Input type="tel" value={formData.patientPhone} onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })} required />
                        </div>
                        <div>
                            <Label>Problem Description</Label>
                            <Textarea value={formData.patientProblem} onChange={(e) => setFormData({ ...formData, patientProblem: e.target.value })} />
                        </div>
                    </div>

                    {/* 📍 NEW LOCATION TOGGLE SECTION */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
                        <Label className="flex items-center gap-2 mb-1"><MapPin className="w-4 h-4 text-primary" /> Service Location</Label>
                        
                        {/* TOGGLE SWITCH */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => handleLocationModeChange('manual')}
                                className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${locationMode === 'manual' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
                            >
                                <Keyboard className="w-3 h-3" /> Manual Entry
                            </button>
                            <button
                                type="button"
                                onClick={() => handleLocationModeChange('gps')}
                                className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${locationMode === 'gps' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400'}`}
                            >
                                <Navigation className="w-3 h-3" /> Detect GPS
                            </button>
                        </div>

                        {/* INPUT BOX (Hamesha dikhega, bas GPS mode mein ReadOnly ya Auto-filled hoga) */}
                        <div className="relative">
                            <Input
                                value={formData.address}
                                onChange={(e) => {
                                    // Jab user type kare, toh 'Manual' mode samjho aur purane coordinates uda do
                                    setLocationMode('manual');
                                    setFormData({ 
                                        ...formData, 
                                        address: e.target.value,
                                        latitude: null, // Force Geocode
                                        longitude: null 
                                    });
                                }}
                                placeholder={locationMode === 'gps' ? "Detecting location..." : "Enter detailed address (e.g. Katraj, Pune)"}
                                className={`bg-slate-50 border-slate-200 ${locationMode === 'gps' ? 'pl-10 text-green-700 font-medium' : ''}`}
                            />
                            {locationMode === 'gps' && isLocationLoading && (
                                <div className="absolute right-3 top-3">
                                    <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-400 px-1">
                             <span>
                                {locationMode === 'gps' && formData.latitude ? '✅ Exact GPS Locked' : '✍️ Using Manual Address'}
                             </span>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-primary mt-4" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : "Find Nearby Provider"}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default BookingRequest;