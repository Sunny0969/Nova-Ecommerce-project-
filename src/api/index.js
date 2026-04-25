/**
 * Central API entry — `import ... from 'api'`.
 * Create React App: set `REACT_APP_API_URL` in `.env.production` before `npm run build`.
 * (This repo uses react-scripts, not Vite — `VITE_API_URL` is not injected here.)
 */
export { default } from './axios';
export * from './axios';
