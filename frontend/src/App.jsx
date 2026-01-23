import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import VerifyOtp from './pages/VerifyOtp';
import CompleteProfile from './pages/CompleteProfile';
import Home from './pages/Home';
import BookingRequest from './pages/BookingRequest';
import Notifications from './pages/Notifications';
import IncomingRequestPopup from './components/IncomingRequestPopup';
import MyBookings from './pages/MyBookings';      // 👈 List Wala Page
import BookingDetails from './pages/BookingDetails';

function App() {
  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
       {/* 👇 YE RAHA MAGIC COMPONENT!
           Isse Routes ke bahar rakha hai taaki ye har page ke upar dikhe.
       */}
       <IncomingRequestPopup />
    <Routes>
      
      <Route path="/" element={<Home />} />
      {/* == Auth Flow Routes == */}
      <Route path="/login" element={<Login />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />

      {/* == Main App Routes == */}
      <Route path="/book-service" element={<BookingRequest />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/booking/:id" element={<BookingDetails />} />

      {/* Redirect Unknown to Login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </div>
  );
}



export default App;