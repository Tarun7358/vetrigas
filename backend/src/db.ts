import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { getSupabase, isSupabaseConfigured } from './supabase';

// Store SQLite database in database/vetri_indane.db as local fallback
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

// Helper wrapper functions for Promisified SQLite + Supabase Cloud queries
export const runQuery = async (sql: string, params: any[] = []): Promise<any> => {
  const result = await new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  // Async Dual Sync to Supabase Cloud DB
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    if (supabase) {
      syncSqlToSupabase(sql, params, supabase).catch(err => {
        console.warn('[SUPABASE SYNC NOTE]', err.message || err);
      });
    }
  }

  return result;
};

export const fetchAll = async (sql: string, params: any[] = []): Promise<any[]> => {
  // If Supabase is connected, try reading directly from Supabase Cloud DB
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    if (supabase) {
      const cloudData = await fetchFromSupabase(sql, params, supabase);
      if (cloudData !== null) return cloudData;
    }
  }

  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

export const fetchOne = async (sql: string, params: any[] = []): Promise<any> => {
  const rows = await fetchAll(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
};

// Supabase Direct Fetch Router
async function fetchFromSupabase(sql: string, params: any[], supabase: any): Promise<any[] | null> {
  try {
    const lowerSql = sql.toLowerCase();
    
    if (lowerSql.includes('from employees')) {
      const { data } = await supabase.from('employees').select('*');
      if (data) return data.map((e: any) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        email: e.email,
        password: e.password,
        phone: e.phone,
        joiningDate: e.joining_date,
        attendanceStatus: e.attendance_status,
        workingHours: e.working_hours,
        todayWorkProgress: e.today_work_progress,
        performanceScore: e.performance_score,
        status: e.status,
        hourlyRate: e.hourly_rate,
      }));
    }

    if (lowerSql.includes('from vehicles')) {
      const { data } = await supabase.from('vehicles').select('*');
      if (data) return data.map((v: any) => ({
        id: v.id,
        registrationNumber: v.registration_number,
        driverName: v.driver_name,
        driverId: v.driver_id,
        status: v.status,
        speed: v.speed,
        ignition: v.ignition,
        todayDistanceKm: v.today_distance_km,
        completedDeliveries: v.completed_deliveries,
        totalDeliveries: v.total_deliveries,
        lat: v.lat,
        lng: v.lng,
        hasCamera: v.has_camera,
        cameraStatus: v.camera_status,
      }));
    }

    if (lowerSql.includes('from deliveries')) {
      const { data } = await supabase.from('deliveries').select('*').order('id', { ascending: false });
      if (data) return data.map((d: any) => ({
        id: d.id,
        customerName: d.customer_name,
        address: d.address,
        phone: d.phone,
        category: d.category,
        status: d.status,
        paymentType: d.payment_type,
        amount: d.amount,
        assignedDriverId: d.assigned_driver_id,
        assignedDriverName: d.assigned_driver_name,
        scheduledTime: d.scheduled_time,
        deliveredTime: d.delivered_time,
      }));
    }

    if (lowerSql.includes('from loading_batches')) {
      const { data } = await supabase.from('loading_batches').select('*').order('id', { ascending: false });
      if (data) return data.map((b: any) => ({
        id: b.id,
        batchNumber: b.batch_number,
        vehicleRegistration: b.vehicle_registration,
        driverName: b.driver_name,
        filledCylinders: b.filled_cylinders,
        requiredCount: b.required_count,
        loadedCount: b.loaded_count,
        emptyReturned: b.empty_returned,
        loadmanName: b.loadman_name,
        timestamp: b.timestamp,
        status: b.status,
        discrepancyReason: b.discrepancy_reason,
        discrepancyDiff: b.discrepancy_diff,
      }));
    }

    if (lowerSql.includes('from vehicle_expenses')) {
      const { data } = await supabase.from('vehicle_expenses').select('*').order('id', { ascending: false });
      if (data) return data.map((e: any) => ({
        id: e.id,
        vehicleId: e.vehicle_id,
        driverName: e.driver_name,
        type: e.type,
        amount: e.amount,
        liters: e.liters,
        odometerReading: e.odometer_reading,
        description: e.description,
        billPhotoUrl: e.bill_photo_url,
        date: e.date,
        status: e.status,
      }));
    }

    if (lowerSql.includes('from bills')) {
      const { data } = await supabase.from('bills').select('*').order('id', { ascending: false });
      if (data) return data.map((b: any) => ({
        id: b.id,
        billNumber: b.bill_number,
        customerName: b.customer_name,
        amount: b.amount,
        paymentMethod: b.payment_method,
        transactionId: b.transaction_id,
        driverName: b.driver_name,
        date: b.date,
        status: b.status,
        cylinderCount: b.cylinder_count,
      }));
    }
  } catch (err) {
    console.warn('Supabase fetch note, falling back to SQLite');
  }
  return null;
}

// Supabase Direct Sync Writer
async function syncSqlToSupabase(sql: string, params: any[], supabase: any) {
  const lowerSql = sql.toLowerCase();

  if (lowerSql.includes('insert into deliveries')) {
    const [id, customer_name, address, phone, category, status, payment_type, amount, assigned_driver_id, assigned_driver_name, scheduled_time, delivered_time] = params;
    await supabase.from('deliveries').upsert([{
      id, customer_name, address, phone, category, status, payment_type, amount, assigned_driver_id, assigned_driver_name, scheduled_time, delivered_time
    }], { onConflict: 'id' });
  }

  else if (lowerSql.includes('insert into loading_batches')) {
    const [id, vehicle_registration, driver_name, filled_cylinders, empty_returned, loadman_name, timestamp, status] = params;
    await supabase.from('loading_batches').upsert([{
      id, vehicle_registration, driver_name, filled_cylinders, empty_returned, loadman_name, timestamp, status
    }], { onConflict: 'id' });
  }

  else if (lowerSql.includes('update loading_batches set status')) {
    const [status, loadmanName, id] = params;
    await supabase.from('loading_batches').update({ status, loadman_name: loadmanName || 'Kumar' }).eq('id', id);
  }

  else if (lowerSql.includes('update deliveries set status')) {
    const [status, deliveredTime, id] = params;
    await supabase.from('deliveries').update({ status, delivered_time: deliveredTime }).eq('id', id);
  }

  else if (lowerSql.includes('insert into vehicle_expenses')) {
    const [id, vehicle_id, driver_name, type, amount, liters, odometer_reading, description, bill_photo_url, date, status] = params;
    await supabase.from('vehicle_expenses').upsert([{
      id, vehicle_id, driver_name, type, amount, liters, odometer_reading, description, bill_photo_url, date, status
    }], { onConflict: 'id' });
  }

  else if (lowerSql.includes('insert into bills')) {
    const [id, bill_number, customer_name, amount, payment_method, transaction_id, driver_name, date, status, cylinder_count] = params;
    await supabase.from('bills').upsert([{
      id, bill_number, customer_name, amount, payment_method, transaction_id, driver_name, date, status, cylinder_count
    }], { onConflict: 'id' });
  }
}
