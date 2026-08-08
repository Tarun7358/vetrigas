import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Store SQLite database in database/vetri_indane.db
const dbDir = path.join(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'vetri_indane.db');
console.log(`[SQL DATABASE] Initializing Local SQLite Database file at: ${dbPath}`);

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open local SQLite database:', err);
  } else {
    console.log('✓ Connected to Local SQLite Database successfully (database/vetri_indane.db)');
  }
});

// Helper wrapper functions for Promisified SQLite queries
export const runQuery = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

export const fetchAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

export const fetchOne = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};
