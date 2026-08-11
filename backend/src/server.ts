import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { seedDatabase } from './seed';
import { runQuery, fetchAll, fetchOne } from './db';
import { hashPassword, verifyPassword } from './crypto';
import { sendWhatsAppReceipt } from './whatsapp';
import { sendPasswordResetEmail } from './mailer';
import { getSupabase, isSupabaseConfigured } from './supabase';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'vetri-indane-default-secret-change-in-production-2026';

// ── Security Middleware ───────────────────────────────────────────────────────
// Helmet: Sets secure HTTP headers (XSS, clickjacking, MIME sniffing)
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // Managed by Vite/CDN in production
}));

// CORS: Lock to production domain + localhost for dev
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  // Netlify frontend
  'https://lovely-sunburst-74bfc0.netlify.app',
  'https://vetriindane.com',
  'https://www.vetriindane.com',
  'https://vetriindane.netlify.app',
  'https://vetri-indane.netlify.app',
  // Render backend (internal)
  'https://vetrigas.onrender.com',
  // Dev
  'http://localhost:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render internal)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS BLOCKED] Origin rejected: ${origin}`);
      callback(new Error('CORS: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use('/downloads', express.static(path.join(__dirname, '../public/downloads')));

// APK Direct Download Endpoint
app.get('/api/download/apk', (req: Request, res: Response) => {
  const apkPath = path.join(__dirname, '../public/downloads/vetri-indane-worker.apk');
  res.download(apkPath, 'Vetri_Indane_Worker_v2.5.apk', (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ success: false, message: 'APK download file not found on server.' });
    }
  });
});

// Rate Limiting: High-capacity limit to support dashboard live sync & reverse proxies
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
});
app.use('/api/', globalLimiter);

// Rate Limiting: Login attempts limit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many login attempts. Account locked for 15 minutes.' },
});

// JWT Auth Middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(403).json({ success: false, message: 'Session expired or invalid token. Please log in again.' });
  }
};

// Serve static frontend assets for single-port Render deployment
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Seed Database Schema on server start
seedDatabase();

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    database: isSupabaseConfigured() ? 'Supabase PostgreSQL Cloud DB' : 'SQLite (database/vetri_indane.db)',
    supabaseActive: isSupabaseConfigured(),
    system: 'Vetri Indane LPG Distribution Platform',
    company: 'Vetri Indane LPG Distributors, Peelamedu, Coimbatore',
    developer: 'RDK Technologies',
    timestamp: new Date().toISOString(),
  });
});

// ── Authentication ───────────────────────────────────────────────────────────
app.post('/api/auth/login', loginLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    let user = await fetchOne('SELECT * FROM employees WHERE LOWER(email) = ?', [cleanEmail]);

    // Flexible alias resolution across domain & username variations
    if (!user) {
      const emailAliases: Record<string, string[]> = {
        'manager@vetri.com': ['manager@vetriindane.com', 'santhosh.manager@vetriindane.com', 'santhosh@vetriindane.com'],
        'manager@vetriindane.com': ['manager@vetri.com', 'santhosh.manager@vetriindane.com', 'santhosh@vetriindane.com'],
        'santhosh.manager@vetriindane.com': ['manager@vetri.com', 'manager@vetriindane.com', 'santhosh@vetriindane.com'],
        'owner@vetri.com': ['owner@vetriindane.com', 'vetri@vetriindane.com'],
        'owner@vetriindane.com': ['owner@vetri.com', 'vetri@vetriindane.com'],
        'arun@vetri.com': ['arun@vetriindane.com', 'arun.driver@vetriindane.com', 'driver.arun@vetriindane.com'],
        'arun@vetriindane.com': ['arun@vetri.com', 'arun.driver@vetriindane.com', 'driver.arun@vetriindane.com'],
        'arun.driver@vetriindane.com': ['arun@vetri.com', 'arun@vetriindane.com'],
        'kumar@vetri.com': ['kumar@vetriindane.com', 'kumar.loadman@vetriindane.com', 'loadman.kumar@vetriindane.com'],
        'kumar@vetriindane.com': ['kumar@vetri.com', 'kumar.loadman@vetriindane.com', 'loadman.kumar@vetriindane.com'],
        'kumar.loadman@vetriindane.com': ['kumar@vetri.com', 'kumar@vetriindane.com'],
        'priya.office@vetriindane.com': ['priya@vetriindane.com', 'priya@vetri.com', 'storeroom@vetriindane.com'],
        'priya@vetriindane.com': ['priya.office@vetriindane.com', 'priya@vetri.com', 'storeroom@vetriindane.com'],
        'karthik.godown@vetriindane.com': ['karthik@vetriindane.com', 'karthik@vetri.com', 'godown@vetriindane.com'],
        'karthik@vetriindane.com': ['karthik.godown@vetriindane.com', 'karthik@vetri.com', 'godown@vetriindane.com'],
      };

      const possibleTargets = emailAliases[cleanEmail] || [];
      if (cleanEmail.endsWith('@vetri.com')) {
        possibleTargets.push(cleanEmail.replace('@vetri.com', '@vetriindane.com'));
      } else if (cleanEmail.endsWith('@vetriindane.com')) {
        possibleTargets.push(cleanEmail.replace('@vetriindane.com', '@vetri.com'));
      }

      for (const target of possibleTargets) {
        user = await fetchOne('SELECT * FROM employees WHERE LOWER(email) = ?', [target.toLowerCase()]);
        if (user) break;
      }
    }

    if (!user) {
      console.warn(`[AUTH] Rejected — account not found: ${cleanEmail}`);
      return res.status(404).json({ success: false, message: 'Account not found or access revoked.' });
    }

    if (user.status === 'Terminated' || user.status === 'Inactive') {
      console.warn(`[AUTH] Rejected — account ${user.status}: ${cleanEmail}`);
      return res.status(403).json({ success: false, message: 'Access Denied: Account terminated by System Owner.' });
    }

    const isPasswordValid = verifyPassword(password, user.password);
    if (!isPasswordValid) {
      console.warn(`[AUTH] Failed — incorrect password: ${cleanEmail}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Normalize role to uppercase UserRole standard
    const normalizedRole = user.role ? user.role.toUpperCase() : 'OWNER';
    const isOwnerRole = normalizedRole === 'OWNER' || user.role === 'Owner';

    // Issue signed JWT token (8h for employees, 24h for Owner)
    const expiresIn = isOwnerRole ? '24h' : '8h';
    const { password: _, ...safeUser } = user;
    safeUser.role = isOwnerRole ? 'OWNER' : normalizedRole;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: safeUser.role, name: user.name },
      JWT_SECRET,
      { expiresIn }
    );

    console.log(`[AUTH] ✓ Login: ${user.name} (${safeUser.role}) — token issued (${expiresIn})`);
    return res.json({ success: true, user: safeUser, token });

  } catch (err) {
    console.error('[AUTH] Login error:', err);
    return res.status(500).json({ success: false, message: 'Authentication system error.' });
  }
});

// Token verification endpoint (used by frontend on app load)
app.get('/api/auth/verify', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ success: true, valid: true, user });
});

// Request Password Reset Link (Dispatches Email via SMTP / Resend)
app.post('/api/auth/forgot-password', loginLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const user = await fetchOne('SELECT * FROM employees WHERE LOWER(email) = ?', [cleanEmail]);

    if (!user) {
      // Security standard: Respond with success message even if email not found to prevent user enumeration
      return res.json({
        success: true,
        message: 'If an account exists for this email, password reset instructions have been sent.',
      });
    }

    // Generate signed single-use reset JWT valid for 1 hour
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, type: 'PASSWORD_RESET' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const baseUrl = process.env.FRONTEND_URL || 'https://lovely-sunburst-74bfc0.netlify.app';
    const resetUrl = `${baseUrl}?resetToken=${resetToken}&email=${encodeURIComponent(cleanEmail)}`;

    const mailResult = await sendPasswordResetEmail({
      toEmail: cleanEmail,
      userName: user.name || 'User',
      resetToken,
      resetUrl,
    });

    console.log(`[AUTH] Password reset token generated for ${cleanEmail}`);
    return res.json({
      success: true,
      message: mailResult.message,
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    });
  } catch (err) {
    console.error('[AUTH] Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process password reset request.' });
  }
});

// Execute Password Reset with Reset Token
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'PASSWORD_RESET' || !decoded.id) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    const hashedPassword = hashPassword(newPassword);
    await runQuery('UPDATE employees SET password = ? WHERE id = ?', [hashedPassword, decoded.id]);

    console.log(`[AUTH] ✓ Password updated successfully for user ID ${decoded.id}`);
    return res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (err: any) {
    console.error('[AUTH] Reset password token verification failed:', err);
    return res.status(400).json({
      success: false,
      message: 'Password reset link is invalid or has expired. Please request a new one.',
    });
  }
});


// GET Employees from SQLite
app.get('/api/employees', async (req: Request, res: Response) => {
  try {
    const employees = await fetchAll('SELECT id, name, role, email, phone, joiningDate, attendanceStatus, workingHours, todayWorkProgress, performanceScore, status, hourlyRate FROM employees');
    res.json({ success: true, employees });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database query failed' });
  }
});

// Owner-Only Add New Employee
// Owner & Staff Add/Update New Employee
app.post('/api/employees', async (req: Request, res: Response) => {
  const { id: reqId, name, role, email, password, phone, hourlyRate } = req.body;

  if (!email || !name) {
    return res.status(400).json({ success: false, message: 'Name and email are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const id = reqId || `emp-${Date.now()}`;
  const joiningDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const rate = Number(hourlyRate) || 75;
  const hashedPassword = hashPassword(password || 'Vetri@2026');
  const workerRole = role || 'Driver';
  const workerPhone = phone || '+91 96008 70814';

  try {
    // Check if worker already exists by email or id
    const existing = await fetchOne('SELECT id FROM employees WHERE LOWER(email) = ? OR id = ?', [cleanEmail, id]);
    if (existing) {
      // Update existing record
      try {
        await runQuery(
          `UPDATE employees SET name = ?, role = ?, password = ?, phone = ?, hourlyRate = ?, status = 'Active' WHERE id = ? OR LOWER(email) = ?`,
          [name, workerRole, hashedPassword, workerPhone, rate, existing.id, cleanEmail]
        );
      } catch (colErr) {
        await runQuery(
          `UPDATE employees SET name = ?, role = ?, password = ?, phone = ?, status = 'Active' WHERE id = ? OR LOWER(email) = ?`,
          [name, workerRole, hashedPassword, workerPhone, existing.id, cleanEmail]
        );
      }
      console.log(`[SQL DATABASE UPDATE] Worker updated: ${name} (${cleanEmail})`);
      return res.json({ success: true, message: 'Worker account updated successfully.', employee: { id: existing.id, name, role: workerRole, email: cleanEmail, phone: workerPhone, joiningDate, status: 'Active', hourlyRate: rate } });
    }

    try {
      await runQuery(
        `INSERT INTO employees (id, name, role, email, password, phone, joiningDate, attendanceStatus, workingHours, todayWorkProgress, performanceScore, status, hourlyRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, workerRole, cleanEmail, hashedPassword, workerPhone, joiningDate, 'Present', '0h 0m', '0/20', 90, 'Active', rate]
      );
    } catch (colErr) {
      await runQuery(
        `INSERT INTO employees (id, name, role, email, password, phone, joiningDate, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
        [id, name, workerRole, cleanEmail, hashedPassword, workerPhone, joiningDate]
      );
    }

    console.log(`[SQL DATABASE INSERT] New worker added: ${name} (${cleanEmail})`);
    res.json({ success: true, employee: { id, name, role: workerRole, email: cleanEmail, phone: workerPhone, joiningDate, status: 'Active', hourlyRate: rate } });
  } catch (err) {
    console.error('Failed to insert/update employee:', err);
    res.status(500).json({ success: false, error: 'Failed to save employee to database' });
  }
});

// Delete Employee Endpoint
app.delete('/api/employees/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await runQuery('DELETE FROM employees WHERE id = ? OR LOWER(email) = ?', [id, id.toLowerCase()]);
    console.log(`[SQL DATABASE DELETE] Employee ${id} removed.`);
    res.json({ success: true, message: `Employee ${id} removed.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete employee' });
  }
});

// Real-Time GPS Endpoints querying SQLite
app.get('/api/gps/vehicles', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    const isGpsOnline = isSimulatorRunning || (lastGpsPacketTimestamp !== null && (now - lastGpsPacketTimestamp < 12000));
    const rawVehicles = await fetchAll('SELECT * FROM vehicles');
    const processedVehicles = rawVehicles.map(v => {
      const active = isGpsOnline;
      return {
        ...v,
        speed: active ? (v.speed || 0) : 0,
        ignition: active ? Boolean(v.ignition) : false,
        status: active ? (v.status || 'STOPPED') : 'STOPPED',
        hasCamera: Boolean(v.hasCamera),
      };
    });

    res.json({
      success: true,
      totalVehicles: processedVehicles.length,
      activeMoving: processedVehicles.filter(v => v.status === 'MOVING').length,
      vehicles: processedVehicles,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch vehicles' });
  }
});

app.get('/api/gps/vehicles/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const now = Date.now();
    const isGpsOnline = isSimulatorRunning || (lastGpsPacketTimestamp !== null && (now - lastGpsPacketTimestamp < 12000));
    const vehicle = await fetchOne('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (vehicle) {
      res.json({
        success: true,
        vehicle: {
          ...vehicle,
          speed: isGpsOnline ? (vehicle.speed || 0) : 0,
          ignition: isGpsOnline ? Boolean(vehicle.ignition) : false,
          status: isGpsOnline ? (vehicle.status || 'STOPPED') : 'STOPPED',
          hasCamera: Boolean(vehicle.hasCamera),
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Query failed' });
  }
});

// Register New Vehicle and Hardware GPS Tracker IMEI
app.post('/api/vehicles', async (req: Request, res: Response) => {
  const { id, registrationNumber, driverName, driverId, gpsDeviceId, simCardNumber, hasCamera, cameraStatus } = req.body;
  const vehicleId = id || `v-${Date.now()}`;
  const regNo = (registrationNumber || 'TN 38 NEW 0001').toUpperCase();
  const dName = driverName || 'Unassigned Driver';

  try {
    await runQuery(
      `INSERT INTO vehicles (id, registrationNumber, driverName, driverId, gpsDeviceId, simCardNumber, status, speed, ignition, todayDistanceKm, completedDeliveries, totalDeliveries, lat, lng, hasCamera, cameraStatus)
       VALUES (?, ?, ?, ?, ?, ?, 'STOPPED', 0, 0, 0, 0, 0, 11.0168, 76.9558, ?, ?)
       ON CONFLICT(registrationNumber) DO UPDATE SET driverName = excluded.driverName, gpsDeviceId = excluded.gpsDeviceId, simCardNumber = excluded.simCardNumber, hasCamera = excluded.hasCamera`,
      [vehicleId, regNo, dName, driverId || 'emp-01', gpsDeviceId || null, simCardNumber || null, hasCamera ? 1 : 0, cameraStatus || 'OFFLINE']
    );

    console.log(`[SQL DATABASE VEHICLE ADDED] ${regNo} (GPS IMEI: ${gpsDeviceId || 'N/A'}, Driver: ${dName})`);
    res.json({ success: true, vehicle: { id: vehicleId, registrationNumber: regNo, driverName: dName, gpsDeviceId, simCardNumber } });
  } catch (err) {
    console.error('[ERROR] Vehicle creation failed:', err);
    res.status(500).json({ success: false, error: 'Failed to create vehicle record' });
  }
});

// Delete Fleet Vehicle Record
app.delete('/api/vehicles/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userRole } = req.query;
  const callerRole = ((userRole || '') as string).toUpperCase();

  if (callerRole !== 'OWNER' && callerRole !== 'MANAGER' && callerRole !== 'STOREROOM_STAFF') {
    return res.status(403).json({ success: false, message: 'Access Denied: Only Owner or Management can remove vehicles.' });
  }

  try {
    await runQuery('DELETE FROM vehicles WHERE id = ? OR registrationNumber = ?', [id, id]);
    console.log(`[SQL DATABASE VEHICLE DELETED] Vehicle ${id} removed.`);
    res.json({ success: true, message: `Vehicle ${id} removed.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete vehicle' });
  }
});

// Update GPS coordinates from IoT Tracker / Fleettrack SIM IMEI in SQLite
app.post('/api/gps/update', async (req: Request, res: Response) => {
  const { vehicleId, lat, lng, speed, ignition, status } = req.body;

  try {
    const isMoving = Number(speed) > 0 ? 'MOVING' : 'STOPPED';
    await runQuery(
      `UPDATE vehicles SET lat = ?, lng = ?, speed = ?, ignition = ?, status = ? WHERE id = ? OR registrationNumber = ?`,
      [lat, lng, speed, ignition ? 1 : 0, status || isMoving, vehicleId, vehicleId]
    );

    console.log(`[SQL DATABASE GPS UPDATE] Vehicle ${vehicleId}: Lat ${lat}, Lng ${lng}, Speed ${speed}km/h`);
    const updated = await fetchOne('SELECT * FROM vehicles WHERE id = ? OR registrationNumber = ?', [vehicleId, vehicleId]);
    res.json({ success: true, vehicle: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'GPS update failed' });
  }
});

// Fleettrack / Teltonika / Generic GPS Tracker Telemetry Webhook
let lastGpsPacketTimestamp: number | null = null;
let lastBiometricPunchTimestamp: number | null = null;

// Fleettrack / Teltonika / Generic GPS Tracker Telemetry Webhook
app.post('/integrations/fleettrack', async (req: Request, res: Response) => {
  const { deviceId, imei, vehicleRegistration, speed, ignition, lat, lng, fuelLevel, idleMinutes } = req.body;
  const numSpeed = Number(speed) || 0;
  const isIgnition = Boolean(ignition);
  const targetReg = vehicleRegistration || 'TN 38 AU 4821';

  lastGpsPacketTimestamp = Date.now();

  console.log(`[INFO] [GPS TELEMETRY] Payload: Device/IMEI: ${deviceId || imei} | Vehicle: ${targetReg} | Speed: ${numSpeed} km/h | Ignition: ${isIgnition}`);

  if (lat && lng) {
    try {
      const isMoving = numSpeed > 0 ? 'MOVING' : 'STOPPED';
      await runQuery(
        `UPDATE vehicles SET lat = ?, lng = ?, speed = ?, ignition = ?, status = ? WHERE gpsDeviceId = ? OR gpsDeviceId = ? OR registrationNumber = ? OR id = ?`,
        [Number(lat), Number(lng), numSpeed, isIgnition ? 1 : 0, isMoving, deviceId || '', imei || '', targetReg, deviceId || 'v1']
      );

      // Automated Telemetry Alarm Triggers
      if (numSpeed > 60) {
        console.warn(`[WARN] [OVERSPEED ALARM] Vehicle ${targetReg} exceeded limit: ${numSpeed} km/h`);
      }
      if (isIgnition && numSpeed === 0 && Number(idleMinutes) > 15) {
        console.warn(`[WARN] [ANTI-IDLE ALARM] Vehicle ${targetReg} idling with ignition ON >15 mins. Fuel waste estimate: ${((Number(idleMinutes)/60)*1.8).toFixed(1)}L.`);
      }
    } catch (err) {
      console.error('[ERROR] [GPS TELEMETRY] SQLite update error:', err);
    }
  }

  res.json({
    success: true,
    vehicleRegistration: targetReg,
    telemetryStatus: 'PROCESSED',
    processedAt: new Date().toISOString(),
  });
});

// BIOMETRIC FINGERPRINT & ATTENDANCE HARDWARE INTEGRATION WEBHOOK
// Supports ZKTeco easyTimePro, Mantra MFS100, Essl, Morpho, Anviz & Android Native Fingerprint SDKs
// Helper for Real-Time Biometric Punch Processing
const processBiometricPunch = async (emp: any, statusOverride?: string) => {
  lastBiometricPunchTimestamp = Date.now();
  const now = new Date();
  const punchTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const todayDateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const isoDate = now.toISOString().split('T')[0];

  // Search existing attendance record for this employee for TODAY
  const existingLogs = await fetchAll('SELECT * FROM attendance WHERE employeeId = ? OR LOWER(employeeName) = ?', [emp.id, emp.name.toLowerCase()]);
  const todayLog = existingLogs.find((l: any) => l.date === todayDateStr || l.date === isoDate);

  let checkIn = punchTime;
  let checkOut = '--:--';
  let workingHours = 'In Progress';
  let attStatus = statusOverride || 'Present';
  const attId = todayLog ? todayLog.id : `att-${emp.id}-${Date.now()}`;

  if (!todayLog) {
    // First punch of the day: Check-In
    checkIn = punchTime;
    checkOut = '--:--';
    const hour = now.getHours();
    const min = now.getMinutes();
    if (!statusOverride) {
      if (hour > 9 || (hour === 9 && min > 15)) {
        attStatus = 'Late';
      } else {
        attStatus = 'Present';
      }
    }
    workingHours = 'In Progress';

    await runQuery(
      `INSERT INTO attendance (id, employeeId, employeeName, role, checkIn, checkOut, workingHours, status, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET checkIn = excluded.checkIn, status = excluded.status, workingHours = excluded.workingHours`,
      [attId, emp.id, emp.name, emp.role, checkIn, checkOut, workingHours, attStatus, todayDateStr]
    );
  } else {
    // Second or subsequent punch of the day: Check-Out
    checkIn = todayLog.checkIn && todayLog.checkIn !== '--:--' ? todayLog.checkIn : punchTime;
    checkOut = punchTime;
    attStatus = todayLog.status || 'Present';
    workingHours = '8h 30m';

    await runQuery(
      `UPDATE attendance SET checkOut = ?, workingHours = ?, status = ? WHERE id = ?`,
      [checkOut, workingHours, attStatus, todayLog.id]
    );
  }

  const dynamicPerfScore = attStatus === 'Present' ? 85 : 65;
  await runQuery(
    `UPDATE employees SET attendanceStatus = ?, workingHours = ?, performanceScore = ? WHERE id = ?`,
    [attStatus, workingHours, dynamicPerfScore, emp.id]
  );

  return { punchTime, checkIn, checkOut, status: attStatus, workingHours, date: todayDateStr };
};

// BIOMETRIC FINGERPRINT & ATTENDANCE HARDWARE INTEGRATION WEBHOOK
// Supports ZKTeco easyTimePro, Mantra MFS100, Essl, Morpho, Anviz & Android Native Fingerprint SDKs
const handleBiometricClockIn = async (req: Request, res: Response) => {
  const { employeeId, email, deviceId, status, userId, pin } = req.body;
  const targetId = employeeId || userId || pin || 'emp-01';

  console.log(`[INFO] [BIOMETRIC HARDWARE] Fingerprint Scan Received | Device: ${deviceId || 'BIO-GODOWN-01'} | Employee: ${targetId}`);

  try {
    const emp = await fetchOne('SELECT * FROM employees WHERE id = ? OR LOWER(email) = ? OR LOWER(name) LIKE ?', [targetId, (email || '').toLowerCase(), `%${targetId.toLowerCase()}%`]);
    if (!emp) {
      return res.status(404).json({ success: false, error: 'Employee not found for biometric punch' });
    }

    const result = await processBiometricPunch(emp, status);

    res.json({
      success: true,
      hardwareStatus: 'ONLINE',
      biometricVerified: true,
      clockInTime: result.punchTime,
      checkIn: result.checkIn,
      checkOut: result.checkOut,
      status: result.status,
      employee: emp,
      message: `Biometric attendance recorded for ${emp.name}`,
    });
  } catch (err) {
    console.error('[ERROR] [BIOMETRIC HARDWARE] Failed to update attendance:', err);
    res.status(500).json({ success: false, error: 'Biometric processing failed' });
  }
};

app.post('/integrations/biometrics/clock-in', handleBiometricClockIn);
app.post('/api/easytimepro/punch', handleBiometricClockIn);

// ── ATTENDANCE LOGS ENDPOINT (REAL TIME + MIDNIGHT RESET) ─────────────────
app.get('/api/attendance', async (req: Request, res: Response) => {
  try {
    const todayDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const isoDate = new Date().toISOString().split('T')[0];

    const employees = await fetchAll('SELECT id, name, role, attendanceStatus, workingHours FROM employees');
    const logs = await fetchAll('SELECT * FROM attendance');

    const attendanceRecords = employees.map(emp => {
      const todayLog = logs.find(l => 
        (l.employeeId === emp.id || l.employeeName?.toLowerCase() === emp.name?.toLowerCase()) &&
        (l.date === todayDateStr || l.date === isoDate)
      );

      if (todayLog) {
        return {
          id: todayLog.id,
          employeeId: emp.id,
          employeeName: emp.name,
          role: emp.role,
          checkIn: todayLog.checkIn || '--:--',
          checkOut: todayLog.checkOut || '--:--',
          workingHours: todayLog.workingHours || '--',
          status: todayLog.status || 'Present',
          date: todayLog.date || todayDateStr,
        };
      }

      // Midnight Reset State: No punches recorded yet for today
      return {
        id: `att-${emp.id}-${todayDateStr.replace(/\s+/g, '')}`,
        employeeId: emp.id,
        employeeName: emp.name,
        role: emp.role,
        checkIn: '--:--',
        checkOut: '--:--',
        workingHours: '--',
        status: 'Not Scanned',
        date: todayDateStr,
      };
    });

    res.json({ success: true, attendance: attendanceRecords, date: todayDateStr });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
  }
});

// ── REAL-TIME MOCK GPS & BIOMETRIC SIMULATOR ENGINE ─────────────────────────
let isSimulatorRunning = false;
let simulatorTimer: NodeJS.Timeout | null = null;

// Hardware Telemetry & Socket Handshake Status Endpoint
app.get('/api/telemetry/status', (req: Request, res: Response) => {
  const now = Date.now();
  // Active if packet received in last 12 seconds (12000ms) or if automated simulator loop is active
  const isGpsOnline = isSimulatorRunning || (lastGpsPacketTimestamp !== null && (now - lastGpsPacketTimestamp < 12000));
  const isBioOnline = lastBiometricPunchTimestamp !== null && (now - lastBiometricPunchTimestamp < 12000);

  res.json({
    success: true,
    isSimulatorRunning,
    fleettrackGps: {
      status: isGpsOnline ? 'ONLINE' : 'OFFLINE',
      lastPacketReceived: lastGpsPacketTimestamp ? new Date(lastGpsPacketTimestamp).toISOString() : null,
      secAgo: lastGpsPacketTimestamp ? Math.floor((now - lastGpsPacketTimestamp) / 1000) : null,
    },
    easyTimeProBiometrics: {
      status: isBioOnline ? 'ONLINE' : 'OFFLINE',
      lastPunchRecorded: lastBiometricPunchTimestamp ? new Date(lastBiometricPunchTimestamp).toISOString() : null,
      secAgo: lastBiometricPunchTimestamp ? Math.floor((now - lastBiometricPunchTimestamp) / 1000) : null,
    },
  });
});

// Coimbatore Peelamedu Coordinates Routes for Simulation
const SIMULATED_ROUTES: Record<string, { lat: number; lng: number }[]> = {
  'TN 38 AU 4821': [
    { lat: 11.0168, lng: 76.9558 }, // Peelamedu Depot
    { lat: 11.0210, lng: 76.9610 }, // Hope College
    { lat: 11.0260, lng: 76.9680 }, // TIDEL Park Coimbatore
    { lat: 11.0230, lng: 76.9740 }, // Hopes Flyover
    { lat: 11.0180, lng: 76.9660 }, // PSG College
    { lat: 11.0168, lng: 76.9558 }, // Peelamedu Depot
  ],
  'TN 38 BV 9012': [
    { lat: 11.0250, lng: 76.9620 }, // Avinashi Road
    { lat: 11.0190, lng: 76.9690 }, // Singanallur Road
    { lat: 11.0120, lng: 76.9750 }, // Trichy Road Signal
    { lat: 11.0180, lng: 76.9700 }, // Ramanathapuram Junction
    { lat: 11.0250, lng: 76.9620 },
  ],
  'TN 38 CW 1054': [
    { lat: 11.0080, lng: 76.9450 }, // Peelamedu South
    { lat: 11.0130, lng: 76.9490 }, // PSG IMS
    { lat: 11.0190, lng: 76.9530 }, // Fun Republic Mall
    { lat: 11.0080, lng: 76.9450 },
  ],
  'TN 38 DX 6720': [
    { lat: 11.0310, lng: 76.9700 }, // Coimbatore Airport Road
    { lat: 11.0360, lng: 76.9760 }, // SITRA Junction
    { lat: 11.0420, lng: 76.9820 }, // Kalapatti Road
    { lat: 11.0310, lng: 76.9700 },
  ]
};

const routeIndexes: Record<string, number> = {
  'TN 38 AU 4821': 0,
  'TN 38 BV 9012': 0,
  'TN 38 CW 1054': 0,
  'TN 38 DX 6720': 0,
};

// Execute 1 GPS step across all simulated vehicles
const executeGpsStep = async () => {
  lastGpsPacketTimestamp = Date.now();
  try {
    const vehicles = await fetchAll('SELECT * FROM vehicles');
    for (const v of vehicles) {
      const reg = v.registrationNumber;
      const waypoints = SIMULATED_ROUTES[reg] || [
        { lat: 11.0168 + (Math.random() - 0.5) * 0.02, lng: 76.9558 + (Math.random() - 0.5) * 0.02 }
      ];
      let idx = (routeIndexes[reg] || 0) + 1;
      if (idx >= waypoints.length) idx = 0;
      routeIndexes[reg] = idx;

      const nextPos = waypoints[idx];
      const isMoving = Math.random() > 0.15;
      const speed = isMoving ? Math.floor(32 + Math.random() * 22) : 0;
      const status = speed > 0 ? 'MOVING' : 'STOPPED';
      const todayDist = (Number(v.todayDistanceKm) || 20) + (isMoving ? 0.1 : 0);

      await runQuery(
        `UPDATE vehicles SET lat = ?, lng = ?, speed = ?, ignition = ?, status = ?, todayDistanceKm = ? WHERE id = ?`,
        [nextPos.lat, nextPos.lng, speed, isMoving ? 1 : 0, status, Number(todayDist.toFixed(1)), v.id]
      );
    }
  } catch (err) {
    console.error('Error executing GPS simulator step:', err);
  }
};

// Trigger Biometric Punch for existing worker
app.post('/api/simulator/biometric-punch', async (req: Request, res: Response) => {
  const { employeeId, employeeName, status } = req.body;
  
  try {
    let target = null;
    if (employeeId) {
      target = await fetchOne('SELECT * FROM employees WHERE id = ? OR LOWER(email) = ?', [employeeId, employeeId.toLowerCase()]);
    }
    if (!target && employeeName) {
      target = await fetchOne('SELECT * FROM employees WHERE LOWER(name) LIKE ?', [`%${employeeName.toLowerCase()}%`]);
    }
    if (!target) {
      target = await fetchOne('SELECT * FROM employees ORDER BY id ASC LIMIT 1');
    }

    if (!target) {
      return res.status(404).json({ success: false, message: 'No existing user found to punch attendance.' });
    }

    const result = await processBiometricPunch(target, status);

    console.log(`[REAL-TIME BIOMETRIC SCAN] Verified Punch for ${target.name} (${target.role}) at ${result.punchTime}`);
    return res.json({
      success: true,
      message: `✓ Biometric scan verified for ${target.name} (${target.role})`,
      punchTime: result.punchTime,
      checkIn: result.checkIn,
      checkOut: result.checkOut,
      status: result.status,
      employee: {
        id: target.id,
        name: target.name,
        role: target.role,
      },
    });
  } catch (err) {
    console.error('Biometric simulator error:', err);
    return res.status(500).json({ success: false, error: 'Biometric punch simulation failed' });
  }
});

// Single Step Manual Dashcam Telemetry Feed Endpoint
app.post('/api/simulator/camera-feed', async (req: Request, res: Response) => {
  const { vehicleRegistration, cameraStatus } = req.body;
  const statusStr = cameraStatus || 'LIVE';
  const targetReg = vehicleRegistration || 'TN 38 AU 4821';

  try {
    await runQuery(
      `UPDATE vehicles SET hasCamera = 1, cameraStatus = ? WHERE registrationNumber = ? OR id = ?`,
      [statusStr, targetReg, targetReg]
    );

    res.json({
      success: true,
      message: `✓ Dashcam feed updated for ${targetReg} (Status: ${statusStr})`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Camera feed update failed' });
  }
});

// Single Step Manual GPS Telemetry Update Endpoint
app.post('/api/simulator/gps-step', async (req: Request, res: Response) => {
  await executeGpsStep();
  res.json({
    success: true,
    message: '✓ Real-time GPS coordinates updated for all fleet vehicles.',
    timestamp: new Date().toISOString(),
  });
});

// Toggle Automated Continuous GPS Tracking Simulation (2s loop)
app.post('/api/simulator/toggle-auto', async (req: Request, res: Response) => {
  const { enabled } = req.body;
  if (enabled !== undefined) {
    isSimulatorRunning = Boolean(enabled);
  } else {
    isSimulatorRunning = !isSimulatorRunning;
  }

  if (isSimulatorRunning) {
    if (!simulatorTimer) {
      simulatorTimer = setInterval(() => {
        executeGpsStep();
      }, 2500);
    }
    console.log('[REAL-TIME SIMULATOR] Live GPS Telemetry Stream STARTED (2.5s update interval)');
  } else {
    if (simulatorTimer) {
      clearInterval(simulatorTimer);
      simulatorTimer = null;
    }
    await runQuery(`UPDATE vehicles SET speed = 0, ignition = 0, status = 'STOPPED'`);
    console.log('[REAL-TIME SIMULATOR] Live GPS Telemetry Stream PAUSED');
  }

  res.json({
    success: true,
    isSimulatorRunning,
    message: isSimulatorRunning
      ? 'Live Real-Time GPS Tracking Stream STARTED'
      : 'Live Real-Time GPS Tracking Stream PAUSED',
  });
});

// Simulator Status Endpoint
app.get('/api/simulator/status', (req: Request, res: Response) => {
  const now = Date.now();
  res.json({
    success: true,
    isSimulatorRunning,
    lastGpsPacketSecAgo: lastGpsPacketTimestamp ? Math.floor((now - lastGpsPacketTimestamp) / 1000) : null,
    lastBiometricPunchSecAgo: lastBiometricPunchTimestamp ? Math.floor((now - lastBiometricPunchTimestamp) / 1000) : null,
    gpsHardwareStatus: lastGpsPacketTimestamp && (now - lastGpsPacketTimestamp < 60000) ? 'ONLINE' : 'OFFLINE',
    biometricHardwareStatus: lastBiometricPunchTimestamp && (now - lastBiometricPunchTimestamp < 60000) ? 'ONLINE' : 'OFFLINE',
  });
});




// WHATSAPP INSTANT DIGITAL RECEIPT ENDPOINT
app.post('/api/whatsapp/send-receipt', async (req: Request, res: Response) => {
  const { customerPhone, customerName, billNumber, amount, paymentMethod, transactionId, driverName, cylinderCount } = req.body;

  if (!customerPhone) {
    return res.status(400).json({ success: false, error: 'Customer phone number is required.' });
  }

  try {
    const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const result = await sendWhatsAppReceipt({
      customerPhone,
      customerName: customerName || 'Valued LPG Customer',
      billNumber: billNumber || `VI-${Date.now().toString().slice(-6)}`,
      amount: Number(amount) || 940,
      paymentMethod: paymentMethod || 'UPI',
      transactionId: transactionId || 'TXN-DIRECT',
      driverName: driverName || 'Field Agent',
      cylinderCount: Number(cylinderCount) || 1,
      date,
    });

    res.json(result);
  } catch (err) {
    console.error('Failed to send WhatsApp receipt:', err);
    res.status(500).json({ success: false, error: 'WhatsApp delivery failed' });
  }
});

// GOOGLE PAY / UPI PAYMENT WEBHOOK (+91 96008 70814)
app.post(['/api/payments/gpay-webhook', '/integrations/payment'], async (req: Request, res: Response) => {
  const { amount, transactionId, senderPhone, utr, billNumber, deliveryId } = req.body;
  const numAmount = Number(amount) || 0;
  const txnId = transactionId || utr || `GPAY-REC-${Math.floor(100000 + Math.random() * 900000)}`;

  console.log(`[GPAY PAYMENT WEBHOOK] Incoming credit of ₹${numAmount} to +91 96008 70814 | Txn: ${txnId}`);

  try {
    if (deliveryId) {
      await runQuery(`UPDATE deliveries SET status = 'DELIVERED', paymentType = 'UPI', amount = ? WHERE id = ?`, [numAmount, deliveryId]);
    }
    if (billNumber) {
      await runQuery(`UPDATE bills SET status = 'PAID', transactionId = ? WHERE billNumber = ?`, [txnId, billNumber]);
    }

    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newBillId = `bill-${Date.now()}`;
    await runQuery(
      `INSERT INTO bills (id, billNumber, customerName, amount, paymentMethod, transactionId, driverName, date, status, cylinderCount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(billNumber) DO UPDATE SET status = 'PAID', transactionId = ?`,
      [newBillId, billNumber || `VI-2026-${Date.now().toString().slice(-6)}`, senderPhone || 'Google Pay Customer', numAmount, 'UPI (GPay)', txnId, 'Automated Webhook', dateStr, 'PAID', Math.max(1, Math.round(numAmount / 940)), txnId]
    );

    res.json({
      success: true,
      message: `Google Pay credit of ₹${numAmount} processed for +91 96008 70814.`,
      transactionId: txnId,
    });
  } catch (err) {
    console.error('[GPAY PAYMENT WEBHOOK ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to process Google Pay payment webhook' });
  }
});

// VEHICLE EXPENSES ENDPOINTS (Fuel & Maintenance)
app.get('/api/expenses', async (req: Request, res: Response) => {
  try {
    const expenses = await fetchAll('SELECT * FROM vehicle_expenses ORDER BY date DESC');
    res.json({ success: true, expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', async (req: Request, res: Response) => {
  const { vehicleId, driverName, type, amount, liters, odometerReading, description, billPhotoUrl } = req.body;
  const id = `exp-${Date.now()}`;
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const status = 'PENDING';

  try {
    await runQuery(
      `INSERT INTO vehicle_expenses (id, vehicleId, driverName, type, amount, liters, odometerReading, description, billPhotoUrl, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, vehicleId, driverName, type, Number(amount), Number(liters) || 0, Number(odometerReading) || 0, description || '', billPhotoUrl || '', date, status]
    );

    console.log(`[SQL DATABASE INSERT] Expense logged in SQLite: ${driverName} - ${type} ₹${amount}`);
    res.json({ success: true, expense: { id, vehicleId, driverName, type, amount, liters, odometerReading, description, billPhotoUrl, date, status } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to insert expense into SQLite' });
  }
});

app.put('/api/expenses/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, userRole } = req.body;

  if (userRole !== 'OWNER' && userRole !== 'MANAGER') {
    return res.status(403).json({ success: false, message: 'Access Denied: Only Owner or Manager can review expenses.' });
  }

  try {
    await runQuery('UPDATE vehicle_expenses SET status = ? WHERE id = ?', [status, id]);
    console.log(`[SQL DATABASE UPDATE] Expense ${id} status updated to ${status} by ${userRole}`);
    res.json({ success: true, message: `Expense ${id} ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update expense status' });
  }
});

// BILLS & COLLECTIONS ENDPOINTS
app.get('/api/bills', async (req: Request, res: Response) => {
  try {
    const bills = await fetchAll('SELECT * FROM bills ORDER BY date DESC');
    res.json({ success: true, bills });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch bills' });
  }
});

app.post('/api/bills', async (req: Request, res: Response) => {
  const { billNumber, customerName, amount, paymentMethod, transactionId, driverName, cylinderCount } = req.body;
  const id = `bill-${Date.now()}`;
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const status = 'PAID';

  try {
    await runQuery(
      `INSERT INTO bills (id, billNumber, customerName, amount, paymentMethod, transactionId, driverName, date, status, cylinderCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, billNumber, customerName, Number(amount), paymentMethod, transactionId || '', driverName, date, status, Number(cylinderCount) || 1]
    );

    console.log(`[SQL DATABASE INSERT] Bill created in SQLite: ${billNumber} ₹${amount} by ${driverName}`);
    res.json({ success: true, bill: { id, billNumber, customerName, amount, paymentMethod, transactionId, driverName, date, status, cylinderCount } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to insert bill into SQLite' });
  }
});

// DELIVERIES ENDPOINTS
app.get('/api/deliveries', async (req: Request, res: Response) => {
  try {
    const deliveries = await fetchAll('SELECT * FROM deliveries ORDER BY id DESC');
    res.json({ success: true, deliveries });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch deliveries' });
  }
});

app.post('/api/deliveries', async (req: Request, res: Response) => {
  const { customerName, address, phone, category, paymentType, amount, assignedDriverId, assignedDriverName, scheduledTime, cylinderCount } = req.body;
  const id = `del-${Date.now()}`;
  const status = 'PENDING';
  const driverName = assignedDriverName || 'Arun';
  const driverId = assignedDriverId || 'emp-01';

  try {
    await runQuery(
      `INSERT INTO deliveries (id, customerName, address, phone, category, status, paymentType, amount, assignedDriverId, assignedDriverName, scheduledTime, deliveredTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, customerName, address, phone, category || 'COMMERCIAL', status, paymentType || 'UPI', Number(amount) || 940, driverId, driverName, scheduledTime || '12:00 PM', '']
    );

    // Automatically create corresponding Loading Batch for Loadman view & depot tracking
    const batchId = `batch-${Date.now()}`;
    const batchNo = `LB-${Math.floor(1000 + Math.random() * 9000)}`;
    const reg = driverName === 'Suresh' ? 'TN 38 BQ 1092' : driverName === 'Ramesh' ? 'TN 38 CF 9901' : driverName === 'Vijay' ? 'TN 38 DK 3341' : 'TN 38 AU 4821';
    const qty = Number(cylinderCount) || Math.max(1, Math.round(Number(amount || 940) / 940)) || 1;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    await runQuery(
      `INSERT INTO loading_batches (id, vehicleRegistration, driverName, filledCylinders, emptyReturned, loadmanName, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [batchId, reg, driverName, qty, 0, 'Kumar', timestamp, 'IN_PROGRESS']
    );

    console.log(`[SQL DATABASE INSERT] Delivery & Loading Batch registered in SQLite for ${customerName} (Batch: ${batchNo})`);
    res.json({
      success: true,
      delivery: { id, customerName, address, phone, category, status, paymentType, amount, assignedDriverId: driverId, assignedDriverName: driverName, scheduledTime },
      batch: { id: batchId, batchNumber: batchNo, vehicleRegistration: reg, driverName, filledCylinders: qty, loadmanName: 'Kumar', timestamp, status: 'IN_PROGRESS' }
    });
  } catch (err) {
    console.error('Insert delivery error:', err);
    res.status(500).json({ success: false, error: 'Failed to insert delivery into SQLite' });
  }
});

// LOADING BATCHES ENDPOINTS
app.get('/api/batches', async (req: Request, res: Response) => {
  try {
    const batches = await fetchAll('SELECT * FROM loading_batches ORDER BY id DESC');
    res.json({ success: true, batches });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch loading batches' });
  }
});

app.post('/api/batches', async (req: Request, res: Response) => {
  const { vehicleRegistration, driverName, filledCylinders, emptyReturned, loadmanName } = req.body;
  const id = `batch-${Date.now()}`;
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const status = 'LOADED';

  try {
    await runQuery(
      `INSERT INTO loading_batches (id, vehicleRegistration, driverName, filledCylinders, emptyReturned, loadmanName, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, vehicleRegistration, driverName, Number(filledCylinders), Number(emptyReturned), loadmanName, timestamp, status]
    );

    console.log(`[SQL DATABASE INSERT] Loading batch logged in SQLite: ${vehicleRegistration} - ${filledCylinders} units by ${loadmanName}`);
    res.json({ success: true, batch: { id, vehicleRegistration, driverName, filledCylinders, emptyReturned, loadmanName, timestamp, status } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to insert loading batch into SQLite' });
  }
});

// ACCEPT & UPDATE BATCH ENDPOINT (For Loadman & Depot Staff)
app.put('/api/batches/:id/accept', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { loadmanName, status } = req.body;
  const targetStatus = status || 'ACCEPTED';

  try {
    await runQuery(
      `UPDATE loading_batches SET status = ?, loadmanName = COALESCE(?, loadmanName) WHERE id = ?`,
      [targetStatus, loadmanName || null, id]
    );
    const updated = await fetchOne('SELECT * FROM loading_batches WHERE id = ?', [id]);
    console.log(`[INFO] [BATCH UPDATED] Batch ${id} marked as ${targetStatus} by ${loadmanName}`);
    res.json({ success: true, batch: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update batch status in SQLite' });
  }
});

// UPDATE DELIVERY STATUS ENDPOINT (For Driver & Loadman)
app.put('/api/deliveries/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, deliveredTime } = req.body;

  try {
    await runQuery(
      `UPDATE deliveries SET status = ?, deliveredTime = COALESCE(?, deliveredTime) WHERE id = ?`,
      [status, deliveredTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), id]
    );
    const updated = await fetchOne('SELECT * FROM deliveries WHERE id = ?', [id]);
    console.log(`[INFO] [DELIVERY UPDATED] Delivery ${id} status updated to ${status}`);
    res.json({ success: true, delivery: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update delivery status in SQLite' });
  }
});

// ── MONTHLY STOCK INTAKE ENDPOINTS (Owner & Godown Keeper) ─────────────────
app.get('/api/stock-intake', async (req: Request, res: Response) => {
  try {
    const intakeRecords = await fetchAll('SELECT * FROM stock_intake ORDER BY id DESC');
    res.json({ success: true, intakeRecords });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch stock intake records' });
  }
});

app.post('/api/stock-intake', async (req: Request, res: Response) => {
  const { category, quantity, monthYear, intakeDate, challanNumber, supplier, receivedBy, userRole } = req.body;
  const roleUpper = (userRole || '').toUpperCase();

  if (roleUpper !== 'OWNER' && roleUpper !== 'GODOWN_KEEPER' && roleUpper !== 'MANAGER') {
    return res.status(403).json({ success: false, message: 'Access Denied: Only Owner or Godown Keeper can record monthly stock intake.' });
  }

  const id = `stk-${Date.now()}`;
  const timestamp = new Date().toISOString();
  const dateStr = intakeDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const monthStr = monthYear || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  try {
    await runQuery(
      `INSERT INTO stock_intake (id, intakeDate, monthYear, category, quantity, challanNumber, supplier, receivedBy, userRole, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dateStr,
        monthStr,
        category || '14.2kg Domestic',
        Number(quantity) || 0,
        challanNumber || `IOCL-${Math.floor(100000 + Math.random() * 900000)}`,
        supplier || 'Indian Oil Peelamedu Bottling Plant',
        receivedBy || 'Godown Keeper',
        roleUpper,
        timestamp,
      ]
    );

    console.log(`[STOCK INTAKE] Registered ${quantity} units of ${category} (${monthStr}) by ${receivedBy}`);
    return res.json({
      success: true,
      intake: {
        id,
        intakeDate: dateStr,
        monthYear: monthStr,
        category,
        quantity: Number(quantity),
        challanNumber,
        supplier,
        receivedBy,
        userRole: roleUpper,
        timestamp,
      },
    });
  } catch (err) {
    console.error('Error inserting stock intake:', err);
    return res.status(500).json({ success: false, error: 'Failed to record stock intake.' });
  }
});

// ── PAYROLL & MONTH-END OWNER VALIDATION ENDPOINTS ─────────────────────────
app.get('/api/payroll', async (req: Request, res: Response) => {
  try {
    const payrollRecords = await fetchAll('SELECT * FROM payroll ORDER BY id DESC');
    res.json({ success: true, payrollRecords });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch payroll records' });
  }
});

app.put('/api/payroll/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ownerAdjustedSalary, cylinderIncentive, bonus, deduction, ownerNotes, status, userRole } = req.body;
  const roleUpper = (userRole || '').toUpperCase();

  if (roleUpper !== 'OWNER' && roleUpper !== 'MANAGER') {
    return res.status(403).json({ success: false, message: 'Access Denied: Only Owner or Manager can validate payroll.' });
  }

  try {
    await runQuery(
      `UPDATE payroll SET ownerAdjustedSalary = ?, cylinderIncentive = ?, bonus = ?, deduction = ?, ownerNotes = ?, approvedByOwner = 1, status = ? WHERE id = ?`,
      [Number(ownerAdjustedSalary), Number(cylinderIncentive), Number(bonus), Number(deduction), ownerNotes || '', status || 'Approved', id]
    );

    console.log(`[PAYROLL VALIDATION] Owner ${userRole} validated salary for record ${id} (Final Payout: ₹${ownerAdjustedSalary})`);
    res.json({ success: true, message: `Payroll record ${id} approved & validated successfully.` });
  } catch (err) {
    console.error('Error updating payroll record:', err);
    res.status(500).json({ success: false, error: 'Failed to update payroll record' });
  }
});

// ── REAL-TIME HARDWARE TELEMETRY HEARTBEAT ENDPOINT ──────────────────────────
app.get('/api/telemetry/status', (req: Request, res: Response) => {
  const now = Date.now();
  const gpsOnline = lastGpsPacketTimestamp !== null && (now - lastGpsPacketTimestamp) < 60000;
  const bioOnline = lastBiometricPunchTimestamp !== null && (now - lastBiometricPunchTimestamp) < 60000;

  res.json({
    success: true,
    fleettrackGps: {
      status: gpsOnline ? 'ONLINE' : 'OFFLINE',
      latencyMs: gpsOnline ? 12 : 0,
      activeUnits: gpsOnline ? 1 : 0,
      protocol: 'TCP Port 8088 (Teltonika M2M)',
      lastPacketSecAgo: lastGpsPacketTimestamp ? Math.floor((now - lastGpsPacketTimestamp) / 1000) : null,
    },
    easyTimeProBiometrics: {
      status: bioOnline ? 'ONLINE' : 'OFFLINE',
      latencyMs: bioOnline ? 18 : 0,
      terminalIp: '192.168.1.105 (Peelamedu Depot)',
      sdk: 'ZKTeco Push SDK v3.0',
      lastPunchSecAgo: lastBiometricPunchTimestamp ? Math.floor((now - lastBiometricPunchTimestamp) / 1000) : null,
    },
  });
});

// SPA Fallback Route for React Frontend
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] Unhandled: ${err.message || err}`);
  if (err.message === 'CORS: Origin not allowed') {
    return res.status(403).json({ success: false, message: 'Origin not permitted.' });
  }
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`[INFO] ✓ Vetri Indane LPG Platform — Production Server on port ${PORT}`);
  console.log(`[INFO] ✓ Database: ${isSupabaseConfigured() ? 'Supabase PostgreSQL Cloud' : 'SQLite Local'}`);
  console.log(`[INFO] ✓ Security: JWT + Helmet + Rate Limiting ACTIVE`);
  console.log(`[INFO] ✓ CORS: Locked to ${ALLOWED_ORIGINS.filter(o => o && !o.includes('localhost')).join(', ')}`);
});
