import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Vite ka proxy handle karega isse
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Cookies handle karne ke liye
});

export default api;