import axios from 'axios';
import { clearSesion } from './session';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      clearSesion();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;
