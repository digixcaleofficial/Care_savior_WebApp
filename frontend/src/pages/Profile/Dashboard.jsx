import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Loader2, Briefcase, Calendar, MapPin } from 'lucide-react';
import BottomNav from '../../components/layout/BottomNav';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel Fetching for Speed
        const [profileRes, bookingRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/booking/my-bookings')
        ]);
        
        setProfile(profileRes.data.user);
        // Sirf top 3 recent bookings dikhayenge dashboard pe
        setBookings(bookingRes.data.bookings.slice(0, 3)); 
      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. WELCOME CARD */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Welcome back, {profile?.name}! 👋</h1>
        <p className="opacity-90 mt-1 capitalize">{profile?.role} Account • {profile?.phone}</p>
        
        {profile?.role === 'vendor' && (
           <div className="mt-4 inline-flex items-center bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
             <Briefcase size={14} className="mr-2" />
             Service: {profile?.serviceType}
           </div>
        )}
      </div>

      {/* 2. STATS ROW (Example) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
            <span className="text-slate-400 text-xs font-bold uppercase">Total Bookings</span>
            <p className="text-2xl font-bold text-slate-800">{bookings.length > 0 ? '5+' : '0'}</p> 
            {/* Real stats ke liye backend se count lana padega, abhi hardcode/length use kar sakte ho */}
        </div>
        {/* Add more stats blocks here */}
      </div>

      {/* 3. RECENT ACTIVITY */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-slate-800">Recent Activity</h2>
            <button onClick={() => navigate('/profile/history')} className="text-blue-600 text-sm font-bold hover:underline">View All</button>
        </div>

        <div className="space-y-4">
          {bookings.length === 0 ? (
            <p className="text-center text-slate-400 py-10">No recent activity found.</p>
          ) : (
            bookings.map((booking) => (
              <div key={booking._id} onClick={() => navigate(`/booking/${booking._id}`)} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-blue-50 transition cursor-pointer border border-transparent hover:border-blue-100">
                <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                      ${booking.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}
                   `}>
                      {booking.serviceType[0]}
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-800">{booking.serviceType}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={10} /> {new Date(booking.scheduledDate).toLocaleDateString()}
                      </p>
                   </div>
                </div>
                
                <div className="text-right hidden md:block">
                   <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize 
                      ${booking.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                        'bg-yellow-100 text-yellow-700'}
                   `}>
                      {booking.status}
                   </span>
                   <p className="text-xs text-slate-400 mt-1 font-mono">#{booking._id.slice(-6).toUpperCase()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;