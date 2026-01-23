import React, { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCircle, Info, AlertCircle, Clock } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';

const Notifications = () => {
  const { notifications, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  // Page khulte hi "Read" mark kar do (Badge hat jayega)
  useEffect(() => {
    markAllAsRead();
  }, []);

  // Helper function for Icons based on Type
  const getIcon = (type) => {
    switch(type) {
        case 'success': return <CheckCircle className="text-green-600 w-6 h-6" />;
        case 'error': return <AlertCircle className="text-red-600 w-6 h-6" />;
        case 'NEW_REQUEST': return <Bell className="text-blue-600 w-6 h-6 animate-pulse" />;
        default: return <Info className="text-blue-600 w-6 h-6" />;
    }
  };

  // Helper for Background Color
  const getBgColor = (type) => {
    switch(type) {
        case 'success': return 'bg-green-50 border-green-100';
        case 'error': return 'bg-red-50 border-red-100';
        case 'NEW_REQUEST': return 'bg-blue-50 border-blue-100';
        default: return 'bg-white border-slate-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      
      {/* HEADER */}
      <div className="bg-white px-6 pt-8 pb-4 border-b border-slate-100 sticky top-0 z-10 flex items-center gap-4 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-6 h-6 text-slate-700" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Notifications</h1>
      </div>

      {/* LIST SECTION */}
      <div className="p-4 space-y-3">
        {notifications.length === 0 ? (
          // EMPTY STATE
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 opacity-20 text-slate-900" />
            </div>
            <h3 className="font-bold text-slate-600">No notifications yet</h3>
            <p className="text-xs mt-1">We'll let you know when updates arrive.</p>
          </div>
        ) : (
          // NOTIFICATION CARDS
          notifications.map((n, i) => (
            <div 
                key={i} 
                className={`p-4 rounded-2xl border shadow-sm flex gap-4 animate-in slide-in-from-bottom-2 duration-300 ${getBgColor(n.type)}`}
            >
                {/* Icon Box */}
                <div className="mt-0.5 bg-white p-2 h-fit rounded-full shadow-sm">
                    {getIcon(n.type)}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800">{n.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                    
                    {/* Timestamp (Agar backend se aaya toh wo, nahi toh abhi ka) */}
                    <div className="flex items-center gap-1 mt-3 text-[10px] text-slate-400 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>
                            {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                        </span>
                    </div>
                </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Navigation */}
      <BottomNav />
    </div>
  );
};

export default Notifications;