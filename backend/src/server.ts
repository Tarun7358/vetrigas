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

// GPS Vehicle Telemetry State Store (Coimbatore Routes)
let gpsVehicles = [
  {
    id: "v1",
    registrationNumber: "TN 38 AU 4821",
    driverName: "Arun",
    driverId: "emp-01",
    status: "MOVING",
    speed: 38,
    ignition: true,
    todayDistanceKm: 64.8,
    completedDeliveries: 17,
    totalDeliveries: 24,
    lat: 11.0168,
    lng: 76.9558,
    route: [
      { lat: 11.0168, lng: 76.9558, name: "Peelamedu Depot" },
      { lat: 11.0200, lng: 76.9600, name: "Hope College" },
      { lat: 11.0250, lng: 76.9700, name: "TIDEL Park" },
    ],
    lastUpdatedSecondsAgo: 2,
    hasCamera: true,
    cameraStatus: "LIVE"
  },
  {
    id: "v2",
    registrationNumber: "TN 38 BV 9012",
    driverName: "Suresh",
    driverId: "emp-03",
    status: "MOVING",
    speed: 44,
    ignition: true,
    todayDistanceKm: 89.2,
    completedDeliveries: 21,
    totalDeliveries: 25,
    lat: 11.0250,
    lng: 76.9620,
    route: [
      { lat: 11.0250, lng: 76.9620, name: "Gandhipuram Bus Stand" },
      { lat: 11.0300, lng: 76.9680, name: "Saravanampatti Junction" },
    ],
    lastUpdatedSecondsAgo: 3,
    hasCamera: true,
    cameraStatus: "LIVE"
  },
  {
    id: "v3",
    registrationNumber: "TN 38 CW 1054",
    driverName: "Ramesh",
    driverId: "emp-04",
    status: "STOPPED",
    speed: 0,
    ignition: false,
    todayDistanceKm: 45.1,
    completedDeliveries: 14,
    totalDeliveries: 20,
    lat: 11.0080,
    lng: 76.9450,
    route: [
      { lat: 11.0080, lng: 76.9450, name: "RS Puram Customer Spot" },
    ],
    lastUpdatedSecondsAgo: 12,
    hasCamera: true,
    cameraStatus: "LIVE"
  },
  {
    id: "v4",
    registrationNumber: "TN 38 DX 6720",
    driverName: "Vijay",
    driverId: "emp-05",
    status: "STOPPED",
    speed: 0,
    ignition: false,
    todayDistanceKm: 12.0,
    completedDeliveries: 5,
    totalDeliveries: 18,
    lat: 11.0310,
    lng: 76.9700,
    route: [
      { lat: 11.0310, lng: 76.9700, name: "Singanallur Depot Yard" },
    ],
    lastUpdatedSecondsAgo: 25,
    hasCamera: true,
    cameraStatus: "OFFLINE"
  }
];

// Real-Time GPS Endpoints
app.get('/api/gps/vehicles', (req: Request, res: Response) => {
  res.json({
    success: true,
    totalVehicles: gpsVehicles.length,
    activeMoving: gpsVehicles.filter(v => v.status === 'MOVING').length,
    vehicles: gpsVehicles,
  });
});

app.get('/api/gps/vehicles/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const vehicle = gpsVehicles.find(v => v.id === id);
  if (vehicle) {
    res.json({ success: true, vehicle });
  } else {
    res.status(404).json({ success: false, message: 'Vehicle not found' });
  }
});

// Update GPS coordinates from IoT Tracker / Fleettrack SIM IMEI
app.post('/api/gps/update', (req: Request, res: Response) => {
  const { vehicleId, lat, lng, speed, ignition, status } = req.body;
  
  const vIndex = gpsVehicles.findIndex(v => v.id === vehicleId || v.registrationNumber === vehicleId);
  if (vIndex !== -1) {
    gpsVehicles[vIndex] = {
      ...gpsVehicles[vIndex],
      lat: Number(lat) || gpsVehicles[vIndex].lat,
      lng: Number(lng) || gpsVehicles[vIndex].lng,
      speed: speed !== undefined ? Number(speed) : gpsVehicles[vIndex].speed,
      ignition: ignition !== undefined ? Boolean(ignition) : gpsVehicles[vIndex].ignition,
      status: status || (Number(speed) > 0 ? 'MOVING' : 'STOPPED'),
      lastUpdatedSecondsAgo: 0,
    };
    console.log(`[GPS TELEMETRY UPDATE] Vehicle ${vehicleId}: Lat ${lat}, Lng ${lng}, Speed ${speed}km/h`);
    res.json({ success: true, vehicle: gpsVehicles[vIndex] });
  } else {
    res.status(404).json({ success: false, message: 'Vehicle identifier not registered' });
  }
});

// Fleettrack Integration Webhook Hook
app.post('/integrations/fleettrack', (req: Request, res: Response) => {
  const { deviceId, speed, ignition, lat, lng } = req.body;
  console.log(`[Fleettrack GPS Webhook] Device: ${deviceId} | Speed: ${speed}km/h | Ignition: ${ignition}`);
  
  if (lat && lng) {
    const v = gpsVehicles[0];
    if (v) {
      v.lat = Number(lat);
      v.lng = Number(lng);
      v.speed = Number(speed) || 0;
      v.ignition = Boolean(ignition);
      v.lastUpdatedSecondsAgo = 0;
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
