export type UserRole = 'OWNER' | 'MANAGER' | 'DRIVER' | 'LOADMAN';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  driverName: string;
  driverId: string;
  status: 'MOVING' | 'STOPPED' | 'OFFLINE';
  speed: number; // km/h
  ignition: boolean;
  todayDistanceKm: number;
  completedDeliveries: number;
  totalDeliveries: number;
  lat: number;
  lng: number;
  lastUpdatedSecondsAgo: number;
  hasCamera: boolean;
  cameraStatus: 'LIVE' | 'OFFLINE';
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Driver' | 'Loadman' | 'Manager' | 'Owner';
  phone: string;
  joiningDate: string;
  attendanceStatus: 'Present' | 'Absent' | 'Late';
  workingHours: string; // e.g. "8h 42m"
  todayWorkProgress: string; // e.g. "17/24" or "86/100"
  performanceScore: number; // e.g. 92
  status: 'Active' | 'On Leave' | 'Inactive';
  hourlyRate: number; // ₹
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  checkIn: string; // e.g. "08:15 AM"
  checkOut: string; // e.g. "05:30 PM"
  workingHours: string;
  status: 'Present' | 'Late' | 'Absent';
  source: 'Easy Time Pro'; // Biometric requirement
  date: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  regularHours: number;
  hourlyRate: number;
  otHours: number;
  otRate: number;
  bonus: number;
  deduction: number;
  netSalary: number;
  status: 'Draft' | 'Review' | 'Approved' | 'Locked' | 'Paid';
  month: string; // "August 2026"
}

export interface LoadingBatch {
  id: string;
  batchNumber: string; // "BATCH LB1021"
  driverName: string;
  vehicleNumber: string;
  loadmanName: string;
  requiredCount: number;
  loadedCount: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'DISCREPANCY';
  discrepancyReason?: string;
  discrepancyDiff?: number;
  timestamp: string;
}

export interface DeliveryItem {
  id: string;
  deliveryNumber: string; // "VI10251"
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  cylinderCount: number;
  amount: number; // ₹940
  driverName: string;
  vehicleNumber: string;
  status: 'ASSIGNED' | 'READY' | 'OUT FOR DELIVERY' | 'DELIVERED' | 'FAILED' | 'RETURNED';
  distanceKm: number;
  paymentMethod?: 'UPI' | 'CASH';
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  billNumber?: string;
  deliveryTime?: string;
}

export interface BillRecord {
  id: string;
  billNumber: string; // "VI-2026-001025"
  customerName: string;
  amount: number;
  paymentMethod: 'UPI' | 'CASH';
  transactionId: string;
  driverName: string;
  date: string;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  cylinderCount: number;
}

export interface InventoryMetrics {
  available: number;
  loaded: number;
  withDrivers: number;
  delivered: number;
  returned: number;
  damaged: number;
  total: number;
}

export interface CashReconciliation {
  expectedTotal: number;
  upiReceived: number;
  cashExpected: number;
  cashSubmitted: number;
  difference: number;
  status: 'BALANCED' | 'DISCREPANCY';
}

export interface AlertItem {
  id: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  module: 'Billing' | 'Fleet' | 'Loading' | 'Attendance';
  timestamp: string;
  targetId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  record: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
}

export interface IntegrationState {
  fleettrackConnected: boolean;
  easyTimeProConnected: boolean;
  paymentGatewayConnected: boolean;
}

export interface VehicleExpense {
  id: string;
  type: 'FUEL' | 'MAINTENANCE';
  vehicleNumber: string;
  driverName: string;
  driverId: string;
  amount: number; // ₹
  date: string;
  vendorName: string; // e.g. "HP Petrol Bunk Peelamedu" or "Sri Ram Auto Garage"
  odometerReading?: number; // km
  litersFilled?: number; // L
  description?: string;
  billNumber?: string;
  receiptImage?: string; // Bill copy reference
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
}
