import axios from 'axios';

function normalizeApiOrigin(url) {
  if (url == null || url === '') return '';
  let u = String(url).trim().replace(/\/$/, '');
  if (u.endsWith('/api')) u = u.slice(0, -4);
  return u;
}

// Keep consistent with src/api/axios.js production URL.
const HARDCODED_PRODUCTION_API = 'https://nova-ecommerce-project-backend.onrender.com';

const baseURL = normalizeApiOrigin(
  process.env.NODE_ENV === 'production' ? HARDCODED_PRODUCTION_API : 'http://localhost:5000'
);

export const staffApi = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

staffApi.interceptors.request.use((config) => {
  const staffToken = localStorage.getItem('staffToken');
  if (staffToken) {
    config.headers.Authorization = `Bearer ${staffToken}`;
  }
  return config;
});

staffApi.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status;
    const msg = String(error?.response?.data?.message || '');
    if (status === 403 && /blocked/i.test(msg)) {
      localStorage.removeItem('staffToken');
      localStorage.removeItem('staffPermissions');
      localStorage.removeItem('staffUser');
      if (typeof window !== 'undefined') {
        window.location.assign('/staff-login');
      }
    }
    return Promise.reject(error);
  }
);

export default staffApi;

