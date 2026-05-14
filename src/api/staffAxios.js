import axios from 'axios';
import { TOKEN_KEY } from './axios';

function normalizeApiOrigin(url) {
  if (url == null || url === '') return '';
  let u = String(url).trim().replace(/\/$/, '');
  if (u.endsWith('/api')) u = u.slice(0, -4);
  return u;
}

// Keep consistent with src/api/axios.js (runtime override + production fallback).
const HARDCODED_PRODUCTION_API = 'https://nova-ecommerce-project-backend.onrender.com';

function readRuntimeApiOrigin() {
  if (typeof window === 'undefined' || !window.__REACT_APP_API_URL__) {
    return '';
  }
  return String(window.__REACT_APP_API_URL__);
}

const baseURL = normalizeApiOrigin(
  process.env.NODE_ENV === 'production'
    ? readRuntimeApiOrigin() || HARDCODED_PRODUCTION_API
    : 'http://localhost:5000'
);

export const staffApi = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

staffApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

staffApi.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status;
    const msg = String(error?.response?.data?.message || '');
    if (status === 403 && /blocked/i.test(msg)) {
      localStorage.removeItem(TOKEN_KEY);
      if (typeof window !== 'undefined') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default staffApi;

