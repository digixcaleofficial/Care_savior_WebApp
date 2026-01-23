import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useNotifications } from './NotificationContext'; // Notification context connect kar rahe hain

const SocketContext = createContext();

// Backend URL (Vite environment variable ya direct string)
const ENDPOINT = "http://localhost:5000"; 

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Notification context se function uthaya taaki popups dikha sakein
  const { addNotification } = useNotifications(); 

  useEffect(() => {
    // 1. User data local storage se nikalo
    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
      // 2. Connection start karo
      const newSocket = io(ENDPOINT);
      
      // 3. Backend ko batao: "Main aa gaya, mujhe mere Room mein daalo"
      newSocket.emit("setup", user);

      newSocket.on("connected", () => setIsConnected(true));

      // 🛑 LISTENER 1: Jab bhi koi naya notification aaye
      newSocket.on("new_notification", (notification) => {
        addNotification(notification); // Popup trigger karega
      });

      // 🛑 LISTENER 2: Booking Updates (Accept, Start, etc.)
      // Isse hum alag-alag pages pe use karenge, par global sunna safe hai
      
      setSocket(newSocket);

      return () => newSocket.close(); // Cleanup
    }
  }, []); // Run only on mount (reload)

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);