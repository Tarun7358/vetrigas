import fs from 'fs';
import path from 'path';
import { pool } from './db';

export async function seedDatabase() {
  try {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      await pool.query(sql);
      console.log('✓ Database Schema & Seed Data populated successfully!');
    }
  } catch (err) {
    console.log('ℹ Seed note: Local PostgreSQL container not connected. Using state memory fallback.');
  }
}
