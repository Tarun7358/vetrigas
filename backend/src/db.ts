import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://vetri_admin:VetriSecurePassword2026!@localhost:5432/vetri_indane_db';

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost') ? { rejectUnauthorized: false } : false,
});

export const query = async (text: string, params?: any[]) => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.warn('PostgreSQL Query Error (fallback active):', error);
    throw error;
  }
};
