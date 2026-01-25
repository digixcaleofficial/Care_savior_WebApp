import React, { useEffect, useState } from 'react';
import BottomNav from '../components/layout/BottomNav';
import {
    Search, MapPin, Stethoscope, Ambulance, Pill, FlaskConical,
    Star, Phone, Plus, Bell, CheckCircle, Clock, Wallet
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [userData, setUserData] = useState(null);
    const [role, setRole] = useState('user');
    const navigate = useNavigate();

    useEffect(() => {
        // LocalStorage se data uthao
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUserData(storedUser);
            setRole(storedUser.serviceType ? 'vendor' : 'user'); // Agar serviceType hai toh Vendor hai
        }
    }, []);

    return (
        <div className="bg-slate-50 min-h-screen pb-24 font-sans">

            {/* === 1. DYNAMIC HEADER === */}
            <div className="px-5 pt-6 pb-4 flex justify-between items-center bg-white sticky top-0 z-40 border-b border-slate-100">
                {/* Left: Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                        <Plus className="text-white w-5 h-5" strokeWidth={3} />
                    </div>
                    <span className="font-bold text-slate-800 tracking-tight">CareSaviour</span>
                </div>

                {/* Right: Role Based Action */}
                <div>
                    {role === 'user' ? (
                        <Button onClick={() => navigate('/book-service', {state: { booking: response.data.booking }})} size="sm" className="bg-primary hover:bg-blue-700 rounded-full px-5 text-xs font-bold shadow-md shadow-blue-100">
                            Book Service
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1 text-slate-500 text-[11px] font-semibold bg-slate-100 px-3 py-1.5 rounded-full">
                            <MapPin className="w-3 h-3 text-primary" />
                            <span className="truncate max-w-[100px]">{userData?.address || 'Live Location'}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-5 mt-5 space-y-6">

                {/* === 2. COMMON SEARCH BAR === */}
                <div className="relative group">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder={role === 'user' ? "Search doctors, clinics..." : "Search in your tasks..."}
                        className="pl-12 h-12 rounded-2xl border-none bg-white shadow-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                </div>

                {/* === 3. ROLE BASED BODY === */}
                {role === 'user' ? (
                    /* --- USER VIEW --- */
                    <>
                        {/* PROMO BANNER */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-blue-100">
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black mb-1">20% OFF</h2>
                                <p className="text-blue-50 text-xs font-medium opacity-90">First Doctor Consultation</p>
                                <Button variant="secondary" size="sm" className="mt-4 rounded-xl text-primary font-bold h-8 text-[10px]">CLAIM NOW</Button>
                            </div>
                            <div className="absolute right-[-10px] bottom-[-10px] opacity-20">
                                <Stethoscope size={120} />
                            </div>
                        </div>

                        {/* SERVICE GRID */}
                        <div className="grid grid-cols-4 gap-3">
                            <ServiceCard icon={<Stethoscope />} label="Doctor" />
                            <ServiceCard icon={<Ambulance />} label="Ambulance" />
                            <ServiceCard icon={<Pill />} label="Pharmacy" />
                            <ServiceCard icon={<FlaskConical />} label="Labs" />
                        </div>

                        {/* TOP RATED SECTION */}
                        <div className="pt-2">
                            <h3 className="text-lg font-black text-slate-800 mb-4">Top Rated Near You</h3>
                            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-primary font-bold overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=100&auto=format&fit=crop" alt="Dr" className="object-cover h-full w-full" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm">Dr. Priya Sharma</h4>
                                    <p className="text-[10px] text-slate-400">Cardiologist • 2.4 km</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        <span className="text-[11px] font-bold text-slate-700">4.8</span>
                                    </div>
                                </div>
                                <Button size="sm" className="rounded-xl h-9 px-4 text-xs font-bold">Book</Button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* --- VENDOR VIEW (The Dashboard) --- */
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* WELCOME BACK */}
                        <div>
                            <h2 className="text-xl font-black text-slate-800">Hello, {userData?.name || 'Partner'}!</h2>
                            <p className="text-slate-400 text-xs font-medium">You have 4 appointments today.</p>
                        </div>

                        {/* STATS CARDS */}
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard
                                icon={<CheckCircle className="text-green-500" />}
                                label="Tasks Completed"
                                value="12"
                                bg="bg-green-50"
                            />
                            <StatCard
                                icon={<Wallet className="text-blue-500" />}
                                label="Total Earnings"
                                value="₹4,500"
                                bg="bg-blue-50"
                            />
                        </div>

                        {/* CURRENT TASKS / REQUESTS */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-md font-bold text-slate-800">Upcoming Requests</h3>
                                <span className="text-xs text-primary font-bold">View History</span>
                            </div>

                            {/* Task Card 1 */}
                            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">AS</div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">Amit Shah</h4>
                                            <p className="text-[10px] text-slate-400">Emergency Ambulance Needed</p>
                                        </div>
                                    </div>
                                    <span className="bg-orange-100 text-orange-600 text-[9px] font-bold px-2 py-1 rounded-full uppercase">Urgent</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 rounded-xl h-10 text-xs font-bold border-slate-200">Decline</Button>
                                    <Button className="flex-1 rounded-xl h-10 text-xs font-bold bg-primary">Accept Task</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* EMERGENCY BUTTON (Only for Users) */}
            {role === 'user' && (
                <button className="fixed bottom-24 right-6 bg-red-500 text-white rounded-2xl p-4 shadow-xl shadow-red-100 active:scale-95 transition-transform z-50 flex items-center gap-2">
                    <Phone size={20} className="fill-current" />
                    <span className="text-xs font-black uppercase tracking-widest">SOS</span>
                </button>
            )}

            {/* FOOTER */}
            <BottomNav />
        </div>
    );
};

// --- HELPER COMPONENTS ---

const ServiceCard = ({ icon, label }) => (
    <div className="flex flex-col items-center gap-2">
        <div className="w-full aspect-square bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center text-primary group active:bg-primary active:text-white transition-all">
            {React.cloneElement(icon, { size: 24, strokeWidth: 2 })}
        </div>
        <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">{label}</span>
    </div>
);

const StatCard = ({ icon, label, value, bg }) => (
    <div className={`${bg} p-4 rounded-[2rem] border border-transparent flex flex-col gap-1`}>
        <div className="p-2 bg-white w-fit rounded-xl shadow-sm mb-1">{icon}</div>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{label}</span>
        <span className="text-xl font-black text-slate-800">{value}</span>
    </div>
);

export default Home;