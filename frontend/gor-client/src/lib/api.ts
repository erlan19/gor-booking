import axios from 'axios';

// Railway production backend URL — hardcoded since Vercel env management
// is problematic with auto-deployment. Change here if backend URL changes.
const RAILWAY_API = 'https://gor-booking-production.up.railway.app/api/v1';

const API_BASE = import.meta.env.VITE_API_BASE_URL || RAILWAY_API;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;