/**
 * Vetri Indane — Centralized API Base URL Configuration
 * 
 * Dev:  http://localhost:5000  (local Express backend)
 * Prod: https://vetrigas.onrender.com  (Render backend)
 * 
 * Override via VITE_API_BASE env variable if needed.
 */

const isLocal = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE: string = import.meta.env.VITE_API_BASE ||
  (isLocal ? 'http://localhost:5000' : 'https://vetrigas.onrender.com');
