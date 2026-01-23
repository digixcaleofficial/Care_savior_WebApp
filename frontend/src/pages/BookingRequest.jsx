import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Shadcn textarea (ya normal input use kar)
import { Label } from "@/components/ui/label";
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, Stethoscope, Ambulance, Pill, MapPin, Loader2, Minimize2, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext'; // 👈 Socket sunne ke liye
import { useNotifications } from '../context/NotificationContext';


const BookingRequest = () => {
    const navigate = useNavigate();
    const { socket } = useSocket(); // Socket instance
    const location = useLocation();
    const { addNotification } = useNotifications();

    // Home page se agar koi pre-selected service aayi ho
    const preSelectedService = location.state?.service || 'Doctor';

    const [step, setStep] = useState(1); // 1=Form, 2=Searching
    const [loading, setLoading] = useState(false);
    const [bookingId, setBookingId] = useState(null);

    const [formData, setFormData] = useState({
        serviceType: preSelectedService,
        patientName: '',
        patientAge: '',
        patientGender: 'Male',
        patientPhone: '',
        patientProblem: '',
        address: '', // User ki current location yahan auto-fill honi chahiye
        latitude: null,
        longitude: null
    });

    // 1. User ki Current Location Auto-Fill karo
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.address) {
            setFormData(prev => ({
                ...prev,
                address: user.address,
                // Note: Agar user model mein lat/long saved hai toh wo bhi lo, 
                // warna dobara fetch karne ka logic lagana padega.
                // Abhi ke liye hum assume kar rahe hain user wahi hai jahan register hua tha.
                // Real app mein hum 'navigator.geolocation' dobara call karenge.
            }));

            // Live Location Fetch (Fresh Coordinates ke liye)
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    }))
                })
            }
        }
    }, []);

    // 🛑 SOCKET LISTENER: Agar koi Vendor accept kar le!
    useEffect(() => {
        if (!socket) return;

        const handleAccept = (data) => {
            console.log("Booking Accepted!", data);
            toast.success(`Accepted by ${data.vendorName}!`);
            // Ab hum Tracking Page pe jayenge (OTP dikhane)
            navigate('/booking-track', { state: { booking: data } });
        };

        socket.on('booking_accepted', handleAccept);

        return () => {
            socket.off('booking_accepted', handleAccept);
        };
    }, [socket, navigate]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.latitude || !formData.longitude) {
            return toast.error("Location not detected. Please enable GPS.");
        }

        setLoading(true);
        try {
            const res = await api.post('/booking/create', {
                ...formData,
                scheduledDate: new Date()
            });

            if (res.data.success) {
                setBookingId(res.data.bookingId);
                setStep(2); // Show Searching Screen
                addNotification({
                title: "Request Sent Successfully",
                message: res.data.message || `Request sent to ${res.data.nearbyVendorsCount} nearby providers.`,
                type: 'success', // Green color ke liye
                timestamp: new Date()
            });
                toast.success("Searching for nearby providers...");
            }

        } catch (error) {
            toast.error(error.response?.data?.message || "Booking Failed");
            setStep(1); // Back to form
        } finally {
            setLoading(false);
        }
    };

    // --- RENDERING ---

    // STEP 2: SEARCHING SCREEN (Radar Animation)
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

                <Button
                    variant="outline"
                    className="h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900"
                    onClick={() => {
                        toast("Request running in background", { icon: '⏳' });
                        navigate('/');
                    }}
                >
                    <Minimize2 className="w-4 h-4 mr-2" />
                    Minimize
                </Button>
                <Button variant="outline" className="mt-10 border-red-100 text-red-500" onClick={() => navigate('/')}>
                    Cancel Request
                </Button>
            </div>
        );
    }

    // STEP 1: INPUT FORM
    return (
        <div className="min-h-screen bg-slate-50 pb-10 font-sans">
            <Toaster position="top-center" />

            {/* Header */}
            <div className="bg-white px-5 pt-6 pb-4 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)}><ArrowLeft className="w-6 h-6 text-slate-700" /></button>
                    <h1 className="text-xl font-bold text-slate-800">Request Service</h1>
                </div>
            </div>

            <div className="p-5 space-y-6">

                {/* 1. Service Type Selector */}
                <div className="grid grid-cols-3 gap-3">
                    {['Doctor', 'Nurse', 'Ambulance'].map((type) => (
                        <div
                            key={type}
                            onClick={() => setFormData({ ...formData, serviceType: type })}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${formData.serviceType === type ? 'border-primary bg-blue-50 text-primary' : 'border-white bg-white text-slate-400'}`}
                        >
                            {type === 'Doctor' && <Stethoscope className="mb-1" />}
                            {type === 'Nurse' && <Pill className="mb-1" />}
                            {type === 'Ambulance' && <Ambulance className="mb-1" />}
                            <span className="text-xs font-bold">{type}</span>
                        </div>
                    ))}
                </div>

                {/* 2. Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800 border-b pb-2 mb-2">Patient Details</h3>

                        <div>
                            <Label>Patient Name</Label>
                            <Input
                                placeholder="e.g. Rahul Sharma"
                                value={formData.patientName}
                                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Label>Age</Label>
                                <Input
                                    type="number"
                                    placeholder="25"
                                    value={formData.patientAge}
                                    onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <Label>Gender</Label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white"
                                    value={formData.patientGender}
                                    onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })}
                                >
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label>Contact Number</Label>
                            <Input
                                type="tel"
                                placeholder="9999999999"
                                value={formData.patientPhone}
                                onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <Label>Problem Description</Label>
                            <Textarea
                                placeholder="Describe symptoms (e.g. High fever, chest pain)..."
                                value={formData.patientProblem}
                                onChange={(e) => setFormData({ ...formData, patientProblem: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm space-y-2">
                        <Label className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Location</Label>
                        <Input
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="bg-slate-50 border-none"
                        />
                        <p className="text-[10px] text-slate-400">Current GPS location will be sent to the provider.</p>
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