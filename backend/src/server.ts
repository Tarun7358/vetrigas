import express, { Request, Response } from 'express';
import cors from 'cors';
import { seedDatabase } from './seed';
import { runQuery, fetchAll, fetchOne } from './db';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Seed Database Schema on server start
seedDatabase();

// Base Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    database: 'SQLite (database/vetri_indane.db)',
    system: 'Vetri Indane LPG Control Platform',
    developer: 'RDK Technologies',
    timestamp: new Date().toISOString(),
  });
});

// Role-Based Auth Endpoint querying SQLite
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  try {
    const user = await fetchOne('SELECT * FROM employees WHERE email = ?', [email]);
    if (user) {
      res.json({ success: true, user, token: `token-vetri-${Date.now()}` });
    } else {
      // Fallback for role preset matches
      res.json({ success: true, user: { email, role: role || 'OWNER', name: 'Vetri User' }, token: `token-vetri-${Date.now()}` });
    }
  } catch (err) {
    res.json({ success: true, user: { email, role: role || 'OWNER', name: 'Vetri User' }, token: `token-vetri-${Date.now()}` });
  }
});

// GET Employees from SQLite
app.get('/api/employees', async (req: Request, res: Response) => {
  try {
    const employees = await fetchAll('SELECT * FROM employees');
    res.json({ success: true, employees });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database query failed' });
  }
});

// Owner-Only Add New Employee into SQLite
app.post('/api/employees', async (req: Request, res: Response) => {
  const { name, role, email, password, phone, hourlyRate, userRole } = req.body;
  
  if (userRole !== 'OWNER') {
    return res.status(403).json({ success: false, message: 'Access Denied: Only OWNER can add new workers.' });
  }

  const id = `emp-${Date.now()}`;
  const joiningDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const rate = Number(hourlyRate) || 75;

  try {
    await runQuery(
      `INSERT INTO employees (id, name, role, email, password, phone, joiningDate, attendanceStatus, workingHours, todayWorkProgress, performanceScore, status, hourlyRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, role, email, password || 'Vetri@2026', phone, joiningDate, 'Present', '0h 0m', '0/20', 90, 'Active', rate]
    );

    console.log(`[SQL DATABASE INSERT] New worker added to SQLite: ${name} (${email})`);
    res.json({ success: true, employee: { id, name, role, email, phone, joiningDate, status: 'Active', hourlyRate: rate } });
  } catch (err) {
    console.error('Failed to insert employee into SQLite:', err);
    res.status(500).json({ success: false, error: 'Failed to insert employee into SQLite database' });
  }
});

// Owner-Only Delete Employee from SQLite
app.delete('/api/employees/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userRole } = req.query;

  if (userRole !== 'OWNER') {
    return res.status(403).json({ success: false, message: 'Access Denied: Only OWNER can remove workers.' });
  }

  try {
    await runQuery('DELETE FROM employees WHERE id = ?', [id]);
    console.log(`[SQL DATABASE DELETE] Employee ${id} removed from SQLite database.`);
    res.json({ success: true, message: `Employee ${id} removed from SQLite.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete employee' });
  }
});

// Real-Time GPS Endpoints querying SQLite
app.get('/api/gps/vehicles', async (req: Request, res: Response) => {
  try {
    const vehicles = await fetchAll('SELECT * FROM vehicles');
    res.json({
      success: true,
      totalVehicles: vehicles.length,
      activeMoving: vehicles.filter(v => v.status === 'MOVING').length,
      vehicles: vehicles.map(v => ({ ...v, ignition: Boolean(v.ignition), hasCamera: Boolean(v.hasCamera) })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch vehicles' });
  }
});

app.get('/api/gps/vehicles/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const vehicle = await fetchOne('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (vehicle) {
      res.json({ success: true, vehicle: { ...vehicle, ignition: Boolean(vehicle.ignition) } });
    } else {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Query failed' });
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

// Fleettrack Integration Webhook Hook
app.post('/integrations/fleettrack', async (req: Request, res: Response) => {
  const { deviceId, speed, ignition, lat, lng } = req.body;
  console.log(`[Fleettrack GPS Webhook] Device: ${deviceId} | Speed: ${speed}km/h | Ignition: ${ignition}`);
  
  if (lat && lng) {
    try {
      await runQuery(
        `UPDATE vehicles SET lat = ?, lng = ?, speed = ?, ignition = ? WHERE id = 'v1'`,
        [Number(lat), Number(lng), Number(speed) || 0, ignition ? 1 : 0]
      );
    } catch (err) {
      console.error('Fleettrack webhook SQLite update error:', err);
    }
  }
  res.json({ success: true, processedAt: new Date().toISOString() });
});

app.post('/integrations/easytimepro', (req: Request, res: Response) => {
  const { employeeId, checkInTimestamp } = req.body;
  console.log(`[Easy Time Pro Biometrics Webhook] Emp: ${employeeId} Checked In at ${checkInTimestamp}`);
  res.json({ success: true, synced: true });
});

app.post('/integrations/payment', (req: Request, res: Response) => {
  const { billNumber, amount, transactionId, status } = req.body;
  console.log(`[UPI Payment Provider Webhook] Bill: ${billNumber} | ₹${amount} | Txn: ${transactionId} | Status: ${status}`);
  res.json({ success: true, paymentConfirmed: status === 'PAID' });
});

app.listen(PORT, () => {
  console.log(`🚀 Vetri Indane Express API Server running on port ${PORT}`);
  console.log(`⚡ Engineered by RDK Technologies`);
});
