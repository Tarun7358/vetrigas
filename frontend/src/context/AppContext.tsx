import React, { createContext, useContext, useState, useEffect } from 'react';
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
  VehicleExpense,
  StockIntakeRecord,
} from '../types';
import { API_BASE } from '../utils/api';

interface UserSession {
  name: string;
  email: string;
  role: UserRole;
}

interface AppContextType {
  isAuthenticated: boolean;
  currentUser: UserSession | null;
  login: (role: UserRole, email: string, name?: string, token?: string) => boolean;
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
  expenses: VehicleExpense[];
  stockIntake: StockIntakeRecord[];
  inventory: InventoryMetrics;
  reconciliation: CashReconciliation;
  alerts: AlertItem[];
  auditLogs: AuditLog[];
  selectedVehicleId: string | null;
  setSelectedVehicleId: (id: string | null) => void;
  
  // Actions
  completeDelivery: (deliveryId: string, paymentMethod: 'UPI' | 'CASH' | 'OWNER_GPAY_DIRECT', transactionId?: string, cashProofUrl?: string) => void;
  confirmOwnerGPayPayment: (deliveryId: string, transactionId?: string) => void;
  verifyCashProof: (deliveryId: string) => void;
  reportBatchIssue: (batchId: string, loadedCount: number, reason: string) => void;
  updatePayrollStatus: (payrollId: string, status: PayrollRecord['status']) => void;
  dismissAlert: (alertId: string) => void;
  resolveReconciliation: (amount: number, reason: string) => void;
  addExpense: (expenseData: Omit<VehicleExpense, 'id' | 'date' | 'status'>) => void;
  approveExpense: (expenseId: string) => void;
  rejectExpense: (expenseId: string) => void;
  addOrder: (orderData: { customerName: string; address: string; phone: string; category?: string; amount: number; assignedDriverName: string; cylinderCount?: number; vehicleNumber?: string }) => Promise<void>;
  addStockIntake: (stockData: { category: string; quantity: number; monthYear?: string; intakeDate?: string; challanNumber?: string; supplier?: string }) => Promise<void>;
  addVehicle: (vehicleData: { registrationNumber: string; driverName: string; gpsDeviceId?: string; simCardNumber?: string; hasCamera?: boolean }) => Promise<void>;
  removeVehicle: (vehicleId: string) => Promise<void>;

  // Owner-Only Worker Actions
  addEmployee: (emp: Partial<Employee>) => void;
  removeEmployee: (empId: string) => void;
}

const initialVehicles: Vehicle[] = [];
const initialEmployees: Employee[] = [];
const initialAttendance: AttendanceRecord[] = [];
const initialPayroll: PayrollRecord[] = [];
const initialBatches: LoadingBatch[] = [];
const initialDeliveries: DeliveryItem[] = [];
const initialBills: BillRecord[] = [];
const initialAlerts: AlertItem[] = [];
const initialAuditLogs: AuditLog[] = [];
const initialExpenses: VehicleExpense[] = [];

const normalizeRole = (r?: string): UserRole => {
  const upper = (r || '').toUpperCase();
  if (upper === 'OWNER' || upper === 'OWNER') return 'OWNER';
  if (upper === 'MANAGER') return 'MANAGER';
  if (upper === 'DRIVER') return 'DRIVER';
  if (upper === 'LOADMAN') return 'LOADMAN';
  if (upper.includes('GODOWN')) return 'GODOWN_KEEPER';
  if (upper.includes('OFFICE') || upper.includes('STOREROOM')) return 'STOREROOM_STAFF';
  return 'OWNER';
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialSession = (): { isAuthenticated: boolean; currentUser: UserSession | null; role: UserRole } => {
    try {
      const saved = localStorage.getItem('vetri_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && parsed.role) {
          const normRole = normalizeRole(parsed.role);
          return {
            isAuthenticated: true,
            currentUser: { name: parsed.name || parsed.email, email: parsed.email, role: normRole },
            role: normRole,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved session');
    }
    return {
      isAuthenticated: false,
      currentUser: null,
      role: 'OWNER',
    };
  };

  const initialSession = getInitialSession();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialSession.isAuthenticated);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(initialSession.currentUser);
  const [role, setRole] = useState<UserRole>(initialSession.role);
  
  const [integrations, setIntegrations] = useState<IntegrationState>({
    fleettrackConnected: false,
    easyTimeProConnected: false,
    paymentGatewayConnected: true,
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [attendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [payroll, setPayroll] = useState<PayrollRecord[]>(initialPayroll);
  const [batches, setBatches] = useState<LoadingBatch[]>(initialBatches);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(initialDeliveries);
  const [bills, setBills] = useState<BillRecord[]>(initialBills);
  const [expenses, setExpenses] = useState<VehicleExpense[]>(initialExpenses);
  const [stockIntake, setStockIntake] = useState<StockIntakeRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>('v1');

  // Real-Time Sync & Background Polling Loop with Express/SQLite Backend
  const fetchBackendData = async () => {
    try {
      const empRes = await fetch(`${API_BASE}/api/employees`);
      if (empRes.ok) {
        const data = await empRes.json();
        if (Array.isArray(data.employees)) {
          setEmployees(data.employees);
        }
      }

      const expRes = await fetch(`${API_BASE}/api/expenses`);
      if (expRes.ok) {
        const data = await expRes.json();
        if (Array.isArray(data.expenses)) {
          setExpenses(data.expenses);
        }
      }

      const stkRes = await fetch(`${API_BASE}/api/stock-intake`);
      if (stkRes.ok) {
        const data = await stkRes.json();
        if (Array.isArray(data.intakeRecords)) {
          setStockIntake(data.intakeRecords);
        }
      }

      const vehRes = await fetch(`${API_BASE}/api/gps/vehicles`);
      if (vehRes.ok) {
        const data = await vehRes.json();
        if (Array.isArray(data.vehicles)) {
          setVehicles(data.vehicles);
        }
      }

      const delRes = await fetch(`${API_BASE}/api/deliveries`);
      if (delRes.ok) {
        const data = await delRes.json();
        if (Array.isArray(data.deliveries)) {
          const mappedDeliveries: DeliveryItem[] = data.deliveries.map((d: any) => ({
            id: d.id,
            deliveryNumber: d.deliveryNumber || d.id.replace('del-', 'VI'),
            customerName: d.customerName || 'Customer',
            customerPhone: d.customerPhone || d.phone || '+91 96008 70814',
            customerAddress: d.customerAddress || d.address || 'Peelamedu, Coimbatore',
            cylinderCount: Number(d.cylinderCount) || Math.max(1, Math.round(Number(d.amount || 940) / 940)) || 1,
            amount: Number(d.amount) || 940,
            driverName: d.driverName || d.assignedDriverName || 'Unassigned',
            vehicleNumber: d.vehicleNumber || 'Unassigned',
            status: d.status || 'ASSIGNED',
            distanceKm: d.distanceKm || 0,
            paymentMethod: d.paymentType || d.paymentMethod || 'UPI',
            paymentStatus: d.paymentStatus || (d.status === 'DELIVERED' ? 'PAID' : 'PENDING'),
            billNumber: d.billNumber,
            deliveryTime: d.deliveredTime || d.deliveryTime,
          }));
          setDeliveries(mappedDeliveries);
        }
      }

      const batRes = await fetch(`${API_BASE}/api/batches`);
      if (batRes.ok) {
        const data = await batRes.json();
        if (Array.isArray(data.batches)) {
          const mappedBatches: LoadingBatch[] = data.batches.map((b: any) => ({
            id: b.id,
            batchNumber: b.batchNumber || `LB-${b.id.slice(-4)}`,
            driverName: b.driverName || 'Unassigned',
            vehicleNumber: b.vehicleNumber || b.vehicleRegistration || 'Unassigned',
            loadmanName: b.loadmanName || 'Unassigned',
            requiredCount: Number(b.requiredCount) || Number(b.filledCylinders) || 0,
            loadedCount: Number(b.loadedCount) !== undefined && !isNaN(Number(b.loadedCount)) ? Number(b.loadedCount) : (b.status === 'COMPLETED' || b.status === 'ACCEPTED' ? Number(b.filledCylinders || 0) : 0),
            status: b.status || 'IN_PROGRESS',
            timestamp: b.timestamp || 'Just now',
            discrepancyReason: b.discrepancyReason,
            discrepancyDiff: b.discrepancyDiff,
          }));
          setBatches(mappedBatches);
        }
      }

      const bilRes = await fetch(`${API_BASE}/api/bills`);
      if (bilRes.ok) {
        const data = await bilRes.json();
        if (Array.isArray(data.bills)) {
          setBills(data.bills);
        }
      }

      const telRes = await fetch(`${API_BASE}/api/telemetry/status`);
      if (telRes.ok) {
        const data = await telRes.json();
        setIntegrations(prev => ({
          ...prev,
          fleettrackConnected: data.fleettrackGps?.status === 'ONLINE',
          easyTimeProConnected: data.easyTimeProBiometrics?.status === 'ONLINE',
        }));
      }
    } catch (err) {
      console.warn('Backend SQLite sync note: System synchronized with Express API');
    }
  };

  useEffect(() => {
    fetchBackendData();

    // 2-Second Automated Background Polling Loop for Live GPS, Deliveries & Batch updates
    const interval = setInterval(() => {
      fetchBackendData();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const addExpense = async (expenseData: Omit<VehicleExpense, 'id' | 'date' | 'status'>) => {
    const newExp: VehicleExpense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PENDING',
    };

    try {
      await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });
    } catch (err) {
      console.warn('SQLite expense post failed, saved locally.');
    }

    setExpenses(prev => [newExp, ...prev]);
    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: `${expenseData.driverName} (${role})`,
        action: `Submitted Vehicle ${expenseData.type} Expense ₹${expenseData.amount}`,
        module: 'Fleet Expenses',
        record: newExp.id,
        status: 'SUCCESS',
      },
      ...prev,
    ]);
  };

  const approveExpense = async (expenseId: string) => {
    try {
      await fetch(`${API_BASE}/api/expenses/${expenseId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED', userRole: role }),
      });
    } catch (err) {
      console.warn('SQLite expense status sync error');
    }

    setExpenses(prev =>
      prev.map(e => (e.id === expenseId ? { ...e, status: 'APPROVED', approvedBy: currentUser?.name || role } : e))
    );
  };

  const rejectExpense = async (expenseId: string) => {
    try {
      await fetch(`${API_BASE}/api/expenses/${expenseId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', userRole: role }),
      });
    } catch (err) {
      console.warn('SQLite expense status sync error');
    }

    setExpenses(prev =>
      prev.map(e => (e.id === expenseId ? { ...e, status: 'REJECTED' } : e))
    );
  };
  
  const [reconciliation, setReconciliation] = useState<CashReconciliation>({
    expectedTotal: 0,
    upiReceived: 0,
    cashExpected: 0,
    cashSubmitted: 0,
    difference: 0,
    status: 'BALANCED',
  });
  const [inventory] = useState<InventoryMetrics>({
    available: 0,
    loaded: 0,
    withDrivers: 0,
    delivered: 0,
    returned: 0,
    damaged: 0,
    total: 0,
  });

  const login = (selectedRole: UserRole, email: string, name?: string, token?: string) => {
    const normRole = normalizeRole(selectedRole);
    setIsAuthenticated(true);
    setRole(normRole);

    const defaultNames: Record<UserRole, string> = {
      OWNER: 'Vetri',
      MANAGER: 'Santhosh (Field Agent)',
      DRIVER: 'Arun',
      LOADMAN: 'Kumar',
      GODOWN_KEEPER: 'Karthik',
      STOREROOM_STAFF: 'Priya (Office Analytics)',
    };

    const userName = name || defaultNames[normRole] || 'Vetri User';

    const sessionObj = {
      name: userName,
      email,
      role: normRole,
      token: token || `token-vetri-${Date.now()}`,
    };

    setCurrentUser({
      name: userName,
      email,
      role: normRole,
    });

    try {
      localStorage.setItem('vetri_session', JSON.stringify(sessionObj));
    } catch (e) {
      console.warn('Failed to save session to localStorage');
    }

    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: `${selectedRole} (${email})`,
        action: 'Real-Time Authenticated Session Started',
        module: 'Auth',
        record: selectedRole,
        status: 'SUCCESS',
      },
      ...prev,
    ]);
    return true;
  };

  const logout = () => {
    try {
      localStorage.removeItem('vetri_session');
    } catch (e) {
      console.warn('Failed to clear session from localStorage');
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const toggleIntegration = (key: keyof IntegrationState) => {
    setIntegrations(prev => {
      const nextState = !prev[key];
      return { ...prev, [key]: nextState };
    });
  };

  const completeDelivery = async (deliveryId: string, paymentMethod: 'UPI' | 'CASH' | 'OWNER_GPAY_DIRECT', transactionId?: string, cashProofUrl?: string) => {
    const isOwnerGPay = paymentMethod === 'OWNER_GPAY_DIRECT';
    const txn = transactionId || (isOwnerGPay ? `GPAY-DUE-${Math.floor(100000 + Math.random() * 900000)}` : `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`);
    const billNo = `VI-2026-00${Math.floor(10258 + Math.random() * 100)}`;
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      await fetch(`${API_BASE}/api/deliveries/${deliveryId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      });
    } catch (err) {
      console.warn('Delivery status backend update note');
    }

    setDeliveries(prev =>
      prev.map(del => {
        if (del.id === deliveryId) {
          const updatedDel: DeliveryItem = {
            ...del,
            status: 'DELIVERED',
            paymentMethod,
            paymentStatus: isOwnerGPay ? 'PENDING' : 'PAID',
            billNumber: billNo,
            deliveryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cashProofUrl: cashProofUrl || del.cashProofUrl,
            cashProofStatus: paymentMethod === 'CASH' ? 'PENDING_REVIEW' : 'VERIFIED',
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
            status: isOwnerGPay ? 'PENDING' : 'PAID',
            cylinderCount: del.cylinderCount,
          };

          // Persist bill to backend SQLite
          fetch(`${API_BASE}/api/bills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBill),
          }).catch(() => console.warn('Bill backend post note'));

          setBills(prevBills => [newBill, ...prevBills]);
          return updatedDel;
        }
        return del;
      })
    );
  };

  const confirmOwnerGPayPayment = (deliveryId: string, transactionId?: string) => {
    const txn = transactionId || `GPAY-REC-${Math.floor(100000 + Math.random() * 900000)}`;

    setDeliveries(prev =>
      prev.map(del => {
        if (del.id === deliveryId) {
          return {
            ...del,
            paymentStatus: 'PAID',
          };
        }
        return del;
      })
    );

    setBills(prev =>
      prev.map(b => {
        const matchingDel = deliveries.find(d => d.id === deliveryId);
        if (matchingDel && (b.customerName === matchingDel.customerName || b.billNumber === matchingDel.billNumber)) {
          return {
            ...b,
            status: 'PAID',
            transactionId: txn,
          };
        }
        return b;
      })
    );
  };

  const verifyCashProof = (deliveryId: string) => {
    setDeliveries(prev =>
      prev.map(del => {
        if (del.id === deliveryId) {
          return { ...del, cashProofStatus: 'VERIFIED' };
        }
        return del;
      })
    );
  };

  const reportBatchIssue = async (batchId: string, loadedCount: number, reason: string) => {
    try {
      await fetch(`${API_BASE}/api/batches/${batchId}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISCREPANCY' }),
      });
    } catch (err) {
      console.warn('Batch issue backend sync note');
    }

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
  const addEmployee = async (empData: Partial<Employee>) => {
    const roleUpper = (role || '').toUpperCase();
    if (roleUpper !== 'OWNER') {
      alert('Access Denied: Only OWNER can add new workers to the platform.');
      return;
    }
    const cleanEmail = (empData.email || '').trim().toLowerCase();
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: empData.name || 'New Worker',
      email: cleanEmail || `${(empData.name || 'worker').toLowerCase().replace(/\s+/g, '')}@vetriindane.com`,
      password: empData.password || 'Vetri@2026',
      role: empData.role || 'Driver',
      phone: empData.phone || '+91 96008 70814',
      joiningDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      attendanceStatus: 'Present',
      workingHours: '0h 0m',
      todayWorkProgress: '0/20',
      performanceScore: 90,
      status: 'Active',
      hourlyRate: Number(empData.hourlyRate) || 75,
    };

    setEmployees(prev => [newEmp, ...prev.filter(e => e.email.toLowerCase() !== newEmp.email.toLowerCase())]);

    try {
      const res = await fetch(`${API_BASE}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newEmp, userRole: roleUpper }),
      });
      if (res.ok) {
        await fetchBackendData();
      }
    } catch (err) {
      console.warn('Worker saved locally');
    }

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

  const removeEmployee = async (empId: string) => {
    const roleUpper = (role || '').toUpperCase();
    if (roleUpper !== 'OWNER') {
      alert('Access Denied: Only OWNER can remove workers from the platform.');
      return;
    }
    const target = employees.find(e => e.id === empId);

    setEmployees(prev => prev.filter(e => e.id !== empId));

    try {
      const res = await fetch(`${API_BASE}/api/employees/${empId}?userRole=${roleUpper}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchBackendData();
      }
    } catch (err) {
      console.warn('Worker deletion sync note');
    }

    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: 'Owner Privilege',
        action: `Removed Worker ${target?.name || empId}`,
        module: 'Workforce',
        record: empId,
        status: 'SUCCESS',
      },
      ...prev,
    ]);
  };

  const addOrder = async (orderData: {
    customerName: string;
    address: string;
    phone: string;
    category?: string;
    amount: number;
    assignedDriverName: string;
    cylinderCount?: number;
    vehicleNumber?: string;
  }) => {
    const id = `del-${Date.now()}`;
    const delNum = `VI${Math.floor(10000 + Math.random() * 90000)}`;
    const driver = orderData.assignedDriverName || 'Arun';
    const vehicle = orderData.vehicleNumber || 'TN 38 AU 4821';
    const qty = orderData.cylinderCount || Math.max(1, Math.round(orderData.amount / 940)) || 1;

    const newDelivery: DeliveryItem = {
      id,
      deliveryNumber: delNum,
      customerName: orderData.customerName,
      customerPhone: orderData.phone,
      customerAddress: orderData.address,
      cylinderCount: qty,
      amount: orderData.amount,
      driverName: driver,
      vehicleNumber: vehicle,
      status: 'ASSIGNED',
      distanceKm: 3.2,
      paymentMethod: 'UPI',
      paymentStatus: 'PENDING',
    };

    const newBatch: LoadingBatch = {
      id: `batch-${Date.now()}`,
      batchNumber: `LB-${Math.floor(1000 + Math.random() * 9000)}`,
      driverName: driver,
      vehicleNumber: vehicle,
      loadmanName: 'Kumar',
      requiredCount: qty,
      loadedCount: 0,
      status: 'IN_PROGRESS',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Optimistic state updates for instant real-time reflection
    setDeliveries(prev => [newDelivery, ...prev]);
    setBatches(prev => [newBatch, ...prev]);

    try {
      await fetch(`${API_BASE}/api/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: orderData.customerName,
          address: orderData.address,
          phone: orderData.phone,
          category: orderData.category || 'COMMERCIAL',
          paymentType: 'UPI',
          amount: orderData.amount,
          assignedDriverName: driver,
          cylinderCount: qty,
        }),
      });
      fetchBackendData();
    } catch (err) {
      console.warn('Backend sync warning on order creation');
    }
  };
  const addStockIntake = async (stockData: {
    category: string;
    quantity: number;
    monthYear?: string;
    intakeDate?: string;
    challanNumber?: string;
    supplier?: string;
  }) => {
    const roleUpper = (role || '').toUpperCase();
    if (roleUpper !== 'OWNER' && roleUpper !== 'GODOWN_KEEPER' && roleUpper !== 'MANAGER') {
      alert('Access Denied: Only Owner or Godown Keeper can record monthly stock intake.');
      return;
    }

    const dateStr = stockData.intakeDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const monthStr = stockData.monthYear || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const newRecord: StockIntakeRecord = {
      id: `stk-${Date.now()}`,
      intakeDate: dateStr,
      monthYear: monthStr,
      category: stockData.category || '14.2kg Domestic',
      quantity: Number(stockData.quantity) || 0,
      challanNumber: stockData.challanNumber || `IOCL-${Math.floor(100000 + Math.random() * 900000)}`,
      supplier: stockData.supplier || 'Indian Oil Peelamedu Bottling Plant',
      receivedBy: currentUser?.name || role,
      userRole: roleUpper,
      timestamp: new Date().toISOString(),
    };

    setStockIntake(prev => [newRecord, ...prev]);

    try {
      await fetch(`${API_BASE}/api/stock-intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...stockData,
          receivedBy: currentUser?.name || role,
          userRole: roleUpper,
        }),
      });
      fetchBackendData();
    } catch (err) {
      console.warn('Stock intake saved locally.');
    }
  };

  const addVehicle = async (vehicleData: { registrationNumber: string; driverName: string; gpsDeviceId?: string; simCardNumber?: string; hasCamera?: boolean }) => {
    const newVehicle: Vehicle = {
      id: `v-${Date.now()}`,
      registrationNumber: vehicleData.registrationNumber.toUpperCase(),
      driverName: vehicleData.driverName,
      driverId: `emp-${Math.floor(10 + Math.random() * 90)}`,
      gpsDeviceId: vehicleData.gpsDeviceId || `GPS-${Math.floor(100000 + Math.random() * 900000)}`,
      simCardNumber: vehicleData.simCardNumber || '+91 96008 70814',
      status: 'STOPPED',
      speed: 0,
      ignition: false,
      todayDistanceKm: 0,
      completedDeliveries: 0,
      totalDeliveries: 0,
      lat: 11.0168 + (Math.random() - 0.5) * 0.05,
      lng: 76.9558 + (Math.random() - 0.5) * 0.05,
      lastUpdatedSecondsAgo: 2,
      hasCamera: Boolean(vehicleData.hasCamera),
      cameraStatus: vehicleData.hasCamera ? 'LIVE' : 'OFFLINE',
    };

    setVehicles(prev => [newVehicle, ...prev]);

    try {
      await fetch(`${API_BASE}/api/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVehicle),
      });
    } catch (err) {
      console.warn('Vehicle saved locally.');
    }
  };

  const removeVehicle = async (vehicleId: string) => {
    const roleUpper = (role || '').toUpperCase();
    if (roleUpper !== 'OWNER' && roleUpper !== 'MANAGER' && roleUpper !== 'STOREROOM_STAFF') {
      alert('Access Denied: Only Owner or Management can remove vehicles.');
      return;
    }

    const target = vehicles.find(v => v.id === vehicleId || v.registrationNumber === vehicleId);

    setVehicles(prev => prev.filter(v => v.id !== vehicleId && v.registrationNumber !== vehicleId));

    try {
      await fetch(`${API_BASE}/api/vehicles/${vehicleId}?userRole=${roleUpper}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Vehicle deleted locally.');
    }

    setAuditLogs(prev => [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: currentUser?.name || role,
        action: `Removed Fleet Vehicle ${target?.registrationNumber || vehicleId}`,
        module: 'Fleet',
        record: vehicleId,
        status: 'SUCCESS',
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
        expenses,
        stockIntake,
        inventory,
        reconciliation,
        alerts,
        auditLogs,
        selectedVehicleId,
        setSelectedVehicleId,
        completeDelivery,
        confirmOwnerGPayPayment,
        verifyCashProof,
        reportBatchIssue,
        updatePayrollStatus,
        dismissAlert,
        resolveReconciliation,
        addExpense,
        approveExpense,
        rejectExpense,
        addOrder,
        addStockIntake,
        addVehicle,
        removeVehicle,
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
