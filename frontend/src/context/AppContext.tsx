import React, { createContext, useContext, useState } from 'react';
import type {
  UserRole,
  Vehicle,
  Employee,
  AttendanceRecord,
  PayrollRecord,
  LoadingBatch,
  DeliveryItem,
  BillRecord,
  InventoryMetrics,
  CashReconciliation,
  AlertItem,
  AuditLog,
  IntegrationState,
} from '../types';

interface UserSession {
  name: string;
  email: string;
  role: UserRole;
}

interface AppContextType {
  isAuthenticated: boolean;
  currentUser: UserSession | null;
  login: (role: UserRole, email: string, password: string) => boolean;
  logout: () => void;

  role: UserRole;
  setRole: (role: UserRole) => void;
  integrations: IntegrationState;
  toggleIntegration: (key: keyof IntegrationState) => void;
  vehicles: Vehicle[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  payroll: PayrollRecord[];
  batches: LoadingBatch[];
  deliveries: DeliveryItem[];
  bills: BillRecord[];
  inventory: InventoryMetrics;
  reconciliation: CashReconciliation;
  alerts: AlertItem[];
  auditLogs: AuditLog[];
  selectedVehicleId: string | null;
  setSelectedVehicleId: (id: string | null) => void;
  
  // Actions
  completeDelivery: (deliveryId: string, paymentMethod: 'UPI' | 'CASH', transactionId?: string) => void;
  reportBatchIssue: (batchId: string, loadedCount: number, reason: string) => void;
  updatePayrollStatus: (payrollId: string, status: PayrollRecord['status']) => void;
  dismissAlert: (alertId: string) => void;
  resolveReconciliation: (amount: number, reason: string) => void;

  // Owner-Only Worker Actions
  addEmployee: (emp: Partial<Employee>) => void;
  removeEmployee: (empId: string) => void;
}

const initialVehicles: Vehicle[] = [
  {
    id: 'v1',
    registrationNumber: 'TN XX 1234',
    driverName: 'Arun',
    driverId: 'emp-01',
    status: 'MOVING',
    speed: 34,
    ignition: true,
    todayDistanceKm: 67.4,
    completedDeliveries: 17,
    totalDeliveries: 24,
    lat: 11.0168,
    lng: 76.9558,
    lastUpdatedSecondsAgo: 8,
    hasCamera: true,
    cameraStatus: 'LIVE',
  },
  {
    id: 'v2',
    registrationNumber: 'TN XX 5678',
    driverName: 'Suresh',
    driverId: 'emp-03',
    status: 'MOVING',
    speed: 42,
    ignition: true,
    todayDistanceKm: 89.2,
    completedDeliveries: 21,
    totalDeliveries: 25,
    lat: 11.025,
    lng: 76.962,
    lastUpdatedSecondsAgo: 4,
    hasCamera: true,
    cameraStatus: 'LIVE',
  },
  {
    id: 'v3',
    registrationNumber: 'TN XX 9012',
    driverName: 'Ramesh',
    driverId: 'emp-04',
    status: 'STOPPED',
    speed: 0,
    ignition: false,
    todayDistanceKm: 45.1,
    completedDeliveries: 14,
    totalDeliveries: 20,
    lat: 11.008,
    lng: 76.945,
    lastUpdatedSecondsAgo: 12,
    hasCamera: true,
    cameraStatus: 'LIVE',
  },
];

const initialEmployees: Employee[] = [
  {
    id: 'emp-01',
    name: 'Arun',
    role: 'Driver',
    phone: '+91 98765 43210',
    joiningDate: '12 Jan 2024',
    attendanceStatus: 'Present',
    workingHours: '8h 42m',
    todayWorkProgress: '17/24',
    performanceScore: 92,
    status: 'Active',
    hourlyRate: 75,
  },
  {
    id: 'emp-02',
    name: 'Kumar',
    role: 'Loadman',
    phone: '+91 98765 43211',
    joiningDate: '05 Mar 2024',
    attendanceStatus: 'Present',
    workingHours: '9h 05m',
    todayWorkProgress: '86/100',
    performanceScore: 94,
    status: 'Active',
    hourlyRate: 65,
  },
  {
    id: 'emp-03',
    name: 'Suresh',
    role: 'Driver',
    phone: '+91 98765 43212',
    joiningDate: '18 Jun 2023',
    attendanceStatus: 'Present',
    workingHours: '8h 50m',
    todayWorkProgress: '21/25',
    performanceScore: 96,
    status: 'Active',
    hourlyRate: 80,
  },
];

const initialAttendance: AttendanceRecord[] = [
  { id: 'att-01', employeeId: 'emp-01', employeeName: 'Arun', role: 'Driver', checkIn: '08:15 AM', checkOut: '05:30 PM', workingHours: '8h 42m', status: 'Present', source: 'Easy Time Pro', date: '08 Aug 2026' },
  { id: 'att-02', employeeId: 'emp-02', employeeName: 'Kumar', role: 'Loadman', checkIn: '07:55 AM', checkOut: '05:00 PM', workingHours: '9h 05m', status: 'Present', source: 'Easy Time Pro', date: '08 Aug 2026' },
];

const initialPayroll: PayrollRecord[] = [
  { id: 'pay-01', employeeId: 'emp-01', employeeName: 'Arun', role: 'Driver', regularHours: 172.5, hourlyRate: 75, otHours: 12, otRate: 112.5, bonus: 500, deduction: 200, netSalary: 14587.50, status: 'Review', month: 'August 2026' },
  { id: 'pay-02', employeeId: 'emp-02', employeeName: 'Kumar', role: 'Loadman', regularHours: 180, hourlyRate: 65, otHours: 15, otRate: 97.5, bonus: 400, deduction: 150, netSalary: 13512.50, status: 'Review', month: 'August 2026' },
];

const initialBatches: LoadingBatch[] = [
  { id: 'batch-01', batchNumber: 'BATCH LB1021', driverName: 'Arun', vehicleNumber: 'TN XX 1234', loadmanName: 'Kumar', requiredCount: 25, loadedCount: 23, status: 'DISCREPANCY', discrepancyReason: 'Stock shortage', discrepancyDiff: -2, timestamp: '08:30 AM' },
];

const initialDeliveries: DeliveryItem[] = [
  { id: 'del-01', deliveryNumber: 'VI10251', customerName: 'Raj Kumar', customerPhone: '+91 98401 23456', customerAddress: 'No. 42, Cross Cut Road, Gandhipuram, Coimbatore', cylinderCount: 1, amount: 940, driverName: 'Arun', vehicleNumber: 'TN XX 1234', status: 'OUT FOR DELIVERY', distanceKm: 2.4, paymentStatus: 'PENDING' },
];

const initialBills: BillRecord[] = [
  { id: 'bill-01', billNumber: 'VI-2026-001025', customerName: 'Raj Kumar', amount: 940, paymentMethod: 'UPI', transactionId: 'UPI-98401234-8841', driverName: 'Arun', date: '08 Aug 2026 04:42 PM', status: 'PAID', cylinderCount: 1 },
];

const initialAlerts: AlertItem[] = [
  { id: 'alt-01', type: 'CRITICAL', title: 'Cash mismatch', message: 'Cash expected ₹32,970 vs submitted ₹32,500 (Shortage ₹470)', module: 'Billing', timestamp: '10 mins ago', targetId: 'reconcile-01' },
];

const initialAuditLogs: AuditLog[] = [
  { id: 'audit-01', timestamp: '08 Aug 17:02', user: 'Owner', action: 'System Login', module: 'Auth', record: 'Session Started', status: 'SUCCESS' },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserSession | null>({
    name: 'Vetri',
    email: 'owner@vetri.com',
    role: 'OWNER',
  });
  const [role, setRole] = useState<UserRole>('OWNER');
  
  const [integrations, setIntegrations] = useState<IntegrationState>({
    fleettrackConnected: true,
    easyTimeProConnected: true,
    paymentGatewayConnected: true,
  });
  const [vehicles] = useState<Vehicle[]>(initialVehicles);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [attendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [payroll, setPayroll] = useState<PayrollRecord[]>(initialPayroll);
  const [batches, setBatches] = useState<LoadingBatch[]>(initialBatches);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(initialDeliveries);
  const [bills, setBills] = useState<BillRecord[]>(initialBills);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>('v1');
  
  const [reconciliation, setReconciliation] = useState<CashReconciliation>({
    expectedTotal: 115420,
    upiReceived: 82450,
    cashExpected: 32970,
    cashSubmitted: 32500,
    difference: 470,
    status: 'DISCREPANCY',
  });

  const [inventory] = useState<InventoryMetrics>({
    available: 420,
    loaded: 80,
    withDrivers: 32,
    delivered: 218,
    returned: 18,
    damaged: 4,
    total: 772,
  });

  const login = (selectedRole: UserRole, email: string) => {
    setIsAuthenticated(true);
    setRole(selectedRole);

    const defaultNames: Record<UserRole, string> = {
      OWNER: 'Vetri',
      MANAGER: 'Santhosh',
      DRIVER: 'Arun',
      LOADMAN: 'Kumar',
    };

    setCurrentUser({
      name: defaultNames[selectedRole] || 'Vetri',
      email,
      role: selectedRole,
    });
    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: `${selectedRole} (${email})`,
        action: 'Authenticated Session Started',
        module: 'Auth',
        record: selectedRole,
        status: 'SUCCESS',
      },
      ...prev,
    ]);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const toggleIntegration = (key: keyof IntegrationState) => {
    setIntegrations(prev => {
      const nextState = !prev[key];
      return { ...prev, [key]: nextState };
    });
  };

  const completeDelivery = (deliveryId: string, paymentMethod: 'UPI' | 'CASH', transactionId?: string) => {
    const txn = transactionId || `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const billNo = `VI-2026-00${Math.floor(10258 + Math.random() * 100)}`;
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setDeliveries(prev =>
      prev.map(del => {
        if (del.id === deliveryId) {
          const updatedDel: DeliveryItem = {
            ...del,
            status: 'DELIVERED',
            paymentMethod,
            paymentStatus: 'PAID',
            billNumber: billNo,
            deliveryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          const newBill: BillRecord = {
            id: `bill-${Date.now()}`,
            billNumber: billNo,
            customerName: del.customerName,
            amount: del.amount,
            paymentMethod,
            transactionId: txn,
            driverName: del.driverName,
            date: dateStr,
            status: 'PAID',
            cylinderCount: del.cylinderCount,
          };
          setBills(prevBills => [newBill, ...prevBills]);
          return updatedDel;
        }
        return del;
      })
    );
  };

  const reportBatchIssue = (batchId: string, loadedCount: number, reason: string) => {
    setBatches(prev =>
      prev.map(b => {
        if (b.id === batchId) {
          const diff = loadedCount - b.requiredCount;
          return {
            ...b,
            loadedCount,
            status: diff === 0 ? 'COMPLETED' : 'DISCREPANCY',
            discrepancyReason: reason,
            discrepancyDiff: diff,
          };
        }
        return b;
      })
    );
  };

  const updatePayrollStatus = (payrollId: string, status: PayrollRecord['status']) => {
    setPayroll(prev =>
      prev.map(p => (p.id === payrollId ? { ...p, status } : p))
    );
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const resolveReconciliation = (amount: number, _reason: string) => {
    setReconciliation(prev => ({
      ...prev,
      cashSubmitted: prev.cashSubmitted + amount,
      difference: 0,
      status: 'BALANCED',
    }));
  };

  // Owner-Only Actions
  const addEmployee = (empData: Partial<Employee>) => {
    if (role !== 'OWNER') {
      alert('Access Denied: Only OWNER can add new workers to the platform.');
      return;
    }
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: empData.name || 'New Worker',
      role: empData.role || 'Driver',
      phone: empData.phone || '+91 98765 00000',
      joiningDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      attendanceStatus: 'Present',
      workingHours: '0h 0m',
      todayWorkProgress: '0/20',
      performanceScore: 90,
      status: 'Active',
      hourlyRate: Number(empData.hourlyRate) || 75,
    };

    setEmployees(prev => [newEmp, ...prev]);
    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: 'Owner Privilege',
        action: `Added New Worker ${newEmp.name} (${newEmp.role})`,
        module: 'Workforce',
        record: newEmp.id,
        status: 'SUCCESS',
      },
      ...prev,
    ]);
  };

  const removeEmployee = (empId: string) => {
    if (role !== 'OWNER') {
      alert('Access Denied: Only OWNER can remove workers from the platform.');
      return;
    }
    const target = employees.find(e => e.id === empId);
    setEmployees(prev => prev.filter(e => e.id !== empId));
    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: 'Owner Privilege',
        action: `Removed Worker ${target?.name || empId}`,
        module: 'Workforce',
        record: empId,
        status: 'WARNING',
      },
      ...prev,
    ]);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        login,
        logout,
        role,
        setRole,
        integrations,
        toggleIntegration,
        vehicles,
        employees,
        attendance,
        payroll,
        batches,
        deliveries,
        bills,
        inventory,
        reconciliation,
        alerts,
        auditLogs,
        selectedVehicleId,
        setSelectedVehicleId,
        completeDelivery,
        reportBatchIssue,
        updatePayrollStatus,
        dismissAlert,
        resolveReconciliation,
        addEmployee,
        removeEmployee,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
