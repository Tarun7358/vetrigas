/**
 * Vetri Indane — Centralized Production API Base URL Configuration
 * 
 * Target Backend API: https://vetrigas.onrender.com
 * Override via VITE_API_BASE environment variable if needed.
 */

export const API_BASE: string = (
  import.meta.env.VITE_API_BASE || 'https://vetrigas.onrender.com'
).replace(/\/$/, '');


