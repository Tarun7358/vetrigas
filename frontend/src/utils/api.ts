/**
 * Vetri Indane — Centralized API Base URL Configuration
 * 
 * Dev:  http://localhost:5000  (local Express backend)
 * Prod: https://vetrigas.onrender.com  (Render backend)
 * 
 * Override via VITE_API_BASE env variable if needed.
 */

const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const isLanIp = typeof window !== 'undefined' &&
  (/^192\.168\.\d+\.\d+$/.test(window.location.hostname) ||
   /^10\.\d+\.\d+\.\d+$/.test(window.location.hostname) ||
   /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/.test(window.location.hostname));

export const API_BASE: string = import.meta.env.VITE_API_BASE ||
  (isLocalhost
    ? 'http://localhost:5000'
    : isLanIp
      ? `http://${window.location.hostname}:5000`
      : 'https://vetrigas.onrender.com');

