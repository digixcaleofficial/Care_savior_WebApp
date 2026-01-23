import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import BottomNav from '../components/layout/BottomNav';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('token'); // Auth Token
        const res = await api.get('/booking/my-bookings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookings(res.data.bookings);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  if (loading) return <div className="text-center p-10">Loading Bookings...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">My Bookings</h2>
      
      <div className="space-y-4">
        {bookings.length === 0 ? <p>No bookings found.</p> : bookings.map((booking) => (
          <div key={booking._id} className="bg-white shadow-md rounded-lg p-5 border border-gray-100 flex justify-between items-center hover:shadow-lg transition">
            
            {/* Left Side Info */}
            <div>
              <h3 className="text-lg font-bold text-blue-600">{booking.serviceType.toUpperCase()}</h3>
              <p className="text-sm text-gray-500">{new Date(booking.scheduledDate).toDateString()}</p>
              <span className={`px-2 py-1 text-xs rounded-full mt-2 inline-block
                ${booking.status === 'completed' ? 'bg-green-100 text-green-700' : 
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                {booking.status.toUpperCase()}
              </span>
            </div>

            {/* Right Side Button */}
            <Link to={`/booking/${booking._id}`} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900">
              View Details
            </Link>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
};

export default MyBookings;