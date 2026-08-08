import express, { Request, Response } from 'express';
import cors from 'cors';
import { seedDatabase } from './seed';

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
    system: 'Vetri Indane LPG Control Platform',
    developer: 'RDK Technologies',
    timestamp: new Date().toISOString(),
  });
});

// Role-Based Auth Endpoint
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  const mockUsers: Record<string, any> = {
    OWNER: { email: 'owner@vetri.com', role: 'OWNER', name: 'Vetri', id: 'usr-01' },
    MANAGER: { email: 'manager@vetri.com', role: 'MANAGER', name: 'Santhosh', id: 'usr-02' },
    DRIVER: { email: 'arun@vetri.com', role: 'DRIVER', name: 'Arun', id: 'emp-01' },
    LOADMAN: { email: 'kumar@vetri.com', role: 'LOADMAN', name: 'Kumar', id: 'emp-02' },
  };

  const user = mockUsers[role || 'OWNER'];
  if (user) {
    res.json({ success: true, user, token: `token-vetri-${Date.now()}` });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials or role' });
  }
});

app.get('/api/employees', (req: Request, res: Response) => {
  res.json([
    { id: 'emp-01', name: 'Arun', role: 'Driver', phone: '+91 98765 43210', status: 'Active' },
    { id: 'emp-02', name: 'Kumar', role: 'Loadman', phone: '+91 98765 43211', status: 'Active' },
  ]);
});

// Owner-Only Add New Employee
app.post('/api/employees', (req: Request, res: Response) => {
  const { name, role, phone, hourlyRate, userRole } = req.body;
  
  if (userRole !== 'OWNER') {
    return res.status(403).json({ success: false, message: 'Access Denied: Only OWNER can add new workers.' });
  }

  const newEmp = {
    id: `emp-${Date.now()}`,
    name,
    role,
    phone,
    hourlyRate: Number(hourlyRate) || 75,
    joiningDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: 'Active',
    attendanceStatus: 'Present',
    workingHours: '0h 0m',
    todayWorkProgress: '0/20',
    performanceScore: 90,
  };

  console.log(`[OWNER PRIVILEGE] New worker registered: ${name} (${role})`);
  res.json({ success: true, employee: newEmp });
});

// Owner-Only Delete Employee
app.delete('/api/employees/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userRole } = req.query;

  if (userRole !== 'OWNER') {
    return res.status(403).json({ success: false, message: 'Access Denied: Only OWNER can remove workers.' });
  }

  console.log(`[OWNER PRIVILEGE] Employee ${id} terminated/removed from platform.`);
  res.json({ success: true, message: `Employee ${id} removed.` });
});

app.get('/api/attendance', (req: Request, res: Response) => {
  res.json([
    { id: 'att-01', employeeName: 'Arun', checkIn: '08:15 AM', status: 'Present', source: 'Easy Time Pro' },
  ]);
});

app.get('/api/payroll', (req: Request, res: Response) => {
  res.json({
    month: 'August 2026',
    estimatedTotal: 482450,
    approvedTotal: 465200,
    status: 'Approved',
  });
});

app.get('/api/vehicles', (req: Request, res: Response) => {
  res.json([
    { registrationNumber: 'TN XX 1234', driver: 'Arun', speed: 34, status: 'MOVING' },
  ]);
});

app.get('/api/deliveries', (req: Request, res: Response) => {
  res.json([
    { deliveryNumber: 'VI10251', customer: 'Raj Kumar', amount: 940, status: 'OUT FOR DELIVERY' },
  ]);
});

app.get('/api/billing', (req: Request, res: Response) => {
  res.json({
    totalBills: 184,
    paid: 181,
    pending: 3,
    collection: 113650,
  });
});

app.get('/api/inventory', (req: Request, res: Response) => {
  res.json({
    available: 420,
    loaded: 80,
    withDrivers: 32,
    delivered: 218,
    returned: 18,
    damaged: 4,
  });
});

// INTEGRATION HOOKS
app.post('/integrations/fleettrack', (req: Request, res: Response) => {
  const { deviceId, speed, ignition } = req.body;
  console.log(`[Fleettrack GPS Webhook] Device: ${deviceId} | Speed: ${speed}km/h | Ignition: ${ignition}`);
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
