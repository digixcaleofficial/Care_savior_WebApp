import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔔 Naya Notification Add Karne ka Function
  const addNotification = (newNotif) => {
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);

    // 🚀 Popup logic (30 sec ke liye)
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 border-l-4 border-primary`}>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">{newNotif.title}</p>
          <p className="mt-1 text-xs text-slate-500">{newNotif.message}</p>
        </div>
      </div>
    ), { duration: 30000 }); // 30 Seconds
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);