import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useNotifications } from './NotificationContext';

const SocketContext = createContext();
const ENDPOINT = "http://localhost:5000"; 

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { addNotification } = useNotifications(); 

  useEffect(() => {
    // 1. User data nikalo
    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
      const newSocket = io(ENDPOINT);
      
      // 🛑 FIX: Tera backend 'setup' maang raha hai, 'join-room' nahi!
      // Aur wo user object maang raha hai jisme _id ho.
      newSocket.emit("setup", user);

      newSocket.on("connected", () => setIsConnected(true));

      // Global Notifications (Bell Icon)
      newSocket.on("new_notification", (notification) => {
        addNotification(notification);
      });

      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);