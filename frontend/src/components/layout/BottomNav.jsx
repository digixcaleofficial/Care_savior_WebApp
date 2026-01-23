import React from 'react';
import { Home, Calendar, Bell, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  // Helper function to check active state
  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 py-3 px-6 shadow-[0_-5px_10px_rgba(0,0,0,0.02)] z-50 flex justify-between items-center">
      
      {/* Home Item */}
      <button 
        onClick={() => navigate('/')} 
        className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-primary' : 'text-slate-400'}`}
      >
        <Home className={`w-6 h-6 ${isActive('/') && 'fill-current'}`} />
        <span className="text-[10px] font-medium">Home</span>
      </button>

      {/* Bookings Item */}
      <button 
        onClick={() => navigate('/my-bookings')} 
        className={`flex flex-col items-center gap-1 ${isActive('/bookings') ? 'text-primary' : 'text-slate-400'}`}
      >
        <Calendar className="w-6 h-6" />
        <span className="text-[10px] font-medium">My Bookings</span>
      </button>

      {/* Notifications Item */}
      <button 
        onClick={() => navigate('/notifications')} 
        className={`flex flex-col items-center gap-1 ${isActive('/notifications') ? 'text-primary' : 'text-slate-400'}`}
      >
        <Bell className="w-6 h-6" />
        <span className="text-[10px] font-medium">Notifications</span>
        {/* 🔴 THE COUNTER (Cart-like Badge) */}
        {unreadCount > 0 && (
          <div className="absolute top-[-5px] right-2 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount}
          </div>
        )}
      </button>

      {/* Profile Item */}
      <button 
        onClick={() => navigate('/profile')} 
        className={`flex flex-col items-center gap-1 ${isActive('/profile') ? 'text-primary' : 'text-slate-400'}`}
      >
        <User className="w-6 h-6" />
        <span className="text-[10px] font-medium">Profile</span>
      </button>

    </div>
  );
};

export default BottomNav;