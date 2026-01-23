import axios from 'axios';
import toast from 'react-hot-toast';

// 1. Base Instance Create Karo
const api = axios.create({
  baseURL: '/api', // Vite Proxy handle karega path
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Cookies bhejne ke liye zaroori hai
});

// 2. REQUEST INTERCEPTOR (Har request ke saath Token bhejo)
api.interceptors.request.use(
  (config) => {
    // LocalStorage se token uthao (Agar wahan save kar rahe ho)
    const token = localStorage.getItem('token');
    
    // Agar token hai, toh Header mein jod do
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. RESPONSE INTERCEPTOR (Organizational Level Security 🛡️)
// Ye har response ko check karega. Agar Backend ne '401' bola, toh ye action lega.
api.interceptors.response.use(
  (response) => {
    // Agar sab sahi hai, toh response aage jane do
    return response;
  },
  (error) => {
    // Agar Backend se response aaya hai
    if (error.response) {
      const { status, data } = error.response;

      // CASE 1: 401 Unauthorized (Token Expired / User Deleted / Invalid)
      if (status === 401) {
        console.error("⛔ Security Alert: Session Invalid. Auto Logging Out.");
        
        // Step A: Client side storage saaf karo
        localStorage.removeItem('token');
        localStorage.removeItem('user'); // Agar user info store ki hai
        
        // Step B: User ko pata chalna chahiye kya hua
        // Note: Toast kabhi kabhi login page reload hone pe gayab ho sakta hai
        // isliye hum direct redirect karenge.
        
        // Step C: Force Redirect to Login (Hard Reload ke saath taaki state clear ho jaye)
        if (window.location.pathname !== '/login') {
           window.location.href = '/login';
        }
      }

      // CASE 2: 403 Forbidden (Role Issue - User trying to access Vendor route)
      if (status === 403) {
        toast.error("You are not authorized to access this page.");
      }
      
      // CASE 3: 500 Server Error
      if (status === 500) {
        console.error("Server Error:", data.message);
        // toast.error("Server error. Please try again later.");
      }
    } else if (error.request) {
      // Network Error (Backend down hai)
      console.error("Network Error: No response received");
      toast.error("Network Error. Please check your connection.");
    }

    return Promise.reject(error);
  }
);

export default api;