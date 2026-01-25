import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import BottomNav from '../../components/layout/BottomNav';

const History = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/booking/my-bookings');
        setBookings(res.data.bookings);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Booking History</h2>
      
      <div className="space-y-3">
        {bookings.map((booking) => (
          <div 
            key={booking._id} 
            onClick={() => navigate(`/booking/${booking._id}`)}
            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg text-slate-800">{booking.serviceType}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase
                   ${booking.status === 'completed' ? 'bg-green-100 text-green-700' : 
                     booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                     'bg-blue-100 text-blue-700'}
                `}>
                  {booking.status}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                {booking.location?.address}
              </p>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 text-sm">
               <div className="text-slate-500">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Date</span>
                  {new Date(booking.scheduledDate).toDateString()}
               </div>
               <div className="text-right">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Amount</span>
                  <span className="font-bold text-slate-800">₹{booking.fare?.estimated}</span>
               </div>
            </div>
          </div>
        ))}
        
        {bookings.length === 0 && (
           <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
              <p className="text-slate-400">No history available yet.</p>
           </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default History;