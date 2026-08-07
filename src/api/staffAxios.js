import axios from 'axios';
import { TOKEN_KEY } from './auth';
import { resolveStoreApiOrigin } from '../config/apiOrigin';

export const staffApi = axios.create({
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

staffApi.interceptors.request.use((config) => {
  config.baseURL = resolveStoreApiOrigin();
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
