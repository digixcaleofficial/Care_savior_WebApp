import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import api from '../services/api'; // ✅ Correct API Import
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, Stethoscope, Ambulance, Pill, MapPin, Loader2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';

const BookingRequest = () => {
    const navigate = useNavigate();
    const { socket } = useSocket();
    const location = useLocation();
    const { addNotification } = useNotifications();

    // 🛑 CHECK EDIT MODE: Check if data was passed from BookingDetails page
    const isEditMode = location.state?.editMode || false;
    const existingData = location.state?.existingData || null;

    const preSelectedService = location.state?.service || 'Doctor';

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [bookingId, setBookingId] = useState(null);
    const [isLocationLoading, setIsLocationLoading] = useState(false);

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
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressText)}`);
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

    // ✅ 1. Better GPS Logic
    const getUserLocation = () => {
        setIsLocationLoading(true);
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported");
            setIsLocationLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                console.log("📍 GPS Success:", pos.coords);
                setFormData(prev => ({
                    ...prev,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                }));
                setIsLocationLoading(false);
                toast.success("Location detected!");
            },
            (err) => {
                console.warn("⚠️ GPS Failed:", err.message);
                setIsLocationLoading(false);
                toast("GPS timeout. Please enter address manually.", { icon: 'ℹ️' });
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
    };

    // ✅ 2. INITIALIZATION LOGIC (Handle Edit vs Create)
    useEffect(() => {
        if (isEditMode && existingData) {
            // 🛑 MODE A: EDIT - Populate Form
            console.log("✏️ Edit Mode Active. Pre-filling data...");
            setFormData({
                serviceType: existingData.serviceType,
                patientName: existingData.patientDetails?.name || '',
                patientAge: existingData.patientDetails?.age || '',
                patientGender: existingData.patientDetails?.gender || 'Male',
                patientPhone: existingData.patientDetails?.phone || '',
                patientProblem: existingData.patientDetails?.problemDescription || '',
                address: existingData.location?.address || '',
                // Backend stores [long, lat], so index 1 is lat, 0 is long
                latitude: existingData.location?.coordinates?.[1] || null, 
                longitude: existingData.location?.coordinates?.[0] || null
            });
            setBookingId(existingData._id); // Needed for update API
        } else {
            // 🟢 MODE B: CREATE - Default Logic
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.address) {
                setFormData(prev => ({ ...prev, address: user.address }));
            }
            getUserLocation();
        }
    }, [isEditMode, existingData]);

    // Socket Logic (Only needed for new requests)
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

    // ✅ 3. SMART SUBMIT LOGIC (Create vs Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let finalLat = formData.latitude;
        let finalLng = formData.longitude;

        // Geocoding Logic (If address present but no coords)
        if ((!finalLat || !finalLng) && formData.address) {
            toast("Converting address to location...", { icon: '🗺️' });
            const coords = await getCoordinatesFromAddress(formData.address);
            
            if (coords) {
                finalLat = coords.lat;
                finalLng = coords.lon;
                setFormData(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lon }));
            } else {
                setLoading(false);
                return toast.error("Location not found. Please try a valid city name.");
            }
        }

        if (!finalLat || !finalLng) {
            setLoading(false);
            return toast.error("Location required.");
        }

        try {
            if (isEditMode) {
                // 🛑 UPDATE FLOW (PUT)
                await api.put('/booking/update', {
                    bookingId: bookingId, // ID from state
                    patientDetails: {
                        name: formData.patientName,
                        age: formData.patientAge,
                        gender: formData.patientGender,
                        phone: formData.patientPhone,
                        problemDescription: formData.patientProblem
                    },
                    location: {
                        address: formData.address,
                        coordinates: [finalLng, finalLat] // [Long, Lat]
                    }
                });
                
                toast.success("Booking Details Updated!");
                navigate(-1); // Go back to Details Page
            } else {
                // 🟢 CREATE FLOW (POST)
                const res = await api.post('/booking/create', {
                    ...formData,
                    latitude: finalLat,
                    longitude: finalLng,
                    scheduledDate: new Date()
                });

                if (res.data.success) {
                    setBookingId(res.data.bookingId);
                    setStep(2); // Show Radar Screen
                    addNotification({
                        title: "Request Sent Successfully",
                        message: res.data.message,
                        type: 'success',
                        timestamp: new Date()
                    });
                    toast.success("Searching for nearby providers...");
                }
            }

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Operation Failed");
            if (!isEditMode) setStep(1);
        } finally {
            setLoading(false);
        }
    };

    // ... (Radar Screen for CREATE mode) ...
    if (step === 2) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center p-6">
                <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                    <span className="absolute w-full h-full rounded-full bg-blue-500 opacity-20 animate-ping"></span>
                    <span className="absolute w-24 h-24 rounded-full bg-blue-500 opacity-40 animate-pulse"></span>
                    <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Finding {formData.serviceType}...</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto">
                    We have notified nearby providers. Please wait while they review your request.
                </p>
                <p className="mt-8 text-xs font-mono text-slate-400">ID: {bookingId}</p>
                <Button variant="outline" className="mt-10 border-red-100 text-red-500" onClick={() => navigate('/')}>
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
                    {/* Dynamic Header */}
                    <h1 className="text-xl font-bold text-slate-800">
                        {isEditMode ? "Update Request" : "Request Service"}
                    </h1>
                </div>
            </div>

            <div className="p-5 space-y-6">
                {/* Service Selector (Disabled in Edit Mode usually, or keep enabled if you want to allow changing service) */}
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

                    {/* Location Section */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm space-y-2">
                        <div className="flex justify-between items-center">
                            <Label className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Location</Label>
                            <button 
                                type="button" 
                                onClick={getUserLocation} 
                                className="text-xs text-blue-500 font-bold flex items-center gap-1"
                                disabled={isLocationLoading}
                            >
                                {isLocationLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <MapPin className="w-3 h-3"/>}
                                Detect GPS
                            </button>
                        </div>
                        
                        <Input
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Enter detailed address (e.g. Bibewadi, Pune)"
                            className="bg-slate-50 border-none"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                             <span>{formData.latitude ? `✅ GPS Locked` : `⚠️ GPS Pending (Will use address)`}</span>
                        </div>
                    </div>

                    {/* Dynamic Button Text */}
                    <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-primary mt-4" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : (isEditMode ? "Update Request Details" : "Find Nearby Provider")}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default BookingRequest;