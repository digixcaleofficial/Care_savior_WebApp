import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';


const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token'); // 1. Token check karo
  const location = useLocation(); // 2. Current location pakdo

  if (!token) {
    // 🛑 Agar Token nahi hai, toh Login pe bhejo
    // 'state={{ from: location }}' isliye bheja taaki Login ke baad wapas yahi aa sakein
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Agar Token hai, toh jo page maanga tha wo dikhao
  return children;
};

export default ProtectedRoute;