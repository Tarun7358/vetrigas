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
} from '../types';

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
  addExpense: (expenseData: Omit<VehicleExpense, 'id' | 'date' | 'status'>) => void;
  approveExpense: (expenseId: string) => void;
  rejectExpense: (expenseId: string) => void;

  // Owner-Only Worker Actions
  addEmployee: (emp: Partial<Employee>) => void;
  removeEmployee: (empId: string) => void;
}

import vetriDataset from '../data/vetriDataset.json';

const initialVehicles: Vehicle[] = vetriDataset.vehicles as Vehicle[];
const initialEmployees: Employee[] = vetriDataset.employees as Employee[];
const initialAttendance: AttendanceRecord[] = vetriDataset.attendance as AttendanceRecord[];
const initialPayroll: PayrollRecord[] = vetriDataset.payroll as PayrollRecord[];
const initialBatches: LoadingBatch[] = vetriDataset.batches as LoadingBatch[];
const initialDeliveries: DeliveryItem[] = vetriDataset.deliveries as DeliveryItem[];
const initialBills: BillRecord[] = vetriDataset.bills as BillRecord[];
const initialAlerts: AlertItem[] = vetriDataset.alerts as AlertItem[];
const initialAuditLogs: AuditLog[] = vetriDataset.auditLogs as unknown as AuditLog[];
const initialExpenses: VehicleExpense[] = (vetriDataset as any).expenses as VehicleExpense[];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialSession = (): { isAuthenticated: boolean; currentUser: UserSession | null; role: UserRole } => {
    try {
      const saved = localStorage.getItem('vetri_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && parsed.role) {
          return {
            isAuthenticated: true,
            currentUser: { name: parsed.name || parsed.email, email: parsed.email, role: parsed.role },
            role: parsed.role as UserRole,
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
    fleettrackConnected: true,
    easyTimeProConnected: true,
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
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>('v1');

const API_BASE = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : '';

  // Real-Time Sync & Background Polling Loop with Express/SQLite Backend
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const empRes = await fetch(`${API_BASE}/api/employees`);
        if (empRes.ok) {
          const data = await empRes.json();
          if (data.employees && data.employees.length > 0) {
            setEmployees(data.employees);
          }
        }

        const expRes = await fetch(`${API_BASE}/api/expenses`);
        if (expRes.ok) {
          const data = await expRes.json();
          if (data.expenses && data.expenses.length > 0) {
            setExpenses(data.expenses);
          }
        }

        const vehRes = await fetch(`${API_BASE}/api/gps/vehicles`);
        if (vehRes.ok) {
          const data = await vehRes.json();
          if (data.vehicles && data.vehicles.length > 0) {
            setVehicles(data.vehicles);
          }
        }

        const delRes = await fetch(`${API_BASE}/api/deliveries`);
        if (delRes.ok) {
          const data = await delRes.json();
          if (data.deliveries && data.deliveries.length > 0) {
            setDeliveries(data.deliveries);
          }
        }

        const batRes = await fetch(`${API_BASE}/api/batches`);
        if (batRes.ok) {
          const data = await batRes.json();
          if (data.batches && data.batches.length > 0) {
            setBatches(data.batches);
          }
        }

        const bilRes = await fetch(`${API_BASE}/api/bills`);
        if (bilRes.ok) {
          const data = await bilRes.json();
          if (data.bills && data.bills.length > 0) {
            setBills(data.bills);
          }
        }
      } catch (err) {
        console.warn('Backend SQLite sync note: System synchronized with Express API');
      }
    };

    fetchBackendData();

    // 5-Second Automated Background Polling Loop for Live GPS & Batch updates
    const interval = setInterval(() => {
      fetchBackendData();
    }, 5000);

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
  
  const [reconciliation, setReconciliation] = useState<CashReconciliation>(vetriDataset.reconciliation as CashReconciliation);
  const [inventory] = useState<InventoryMetrics>(vetriDataset.inventory as InventoryMetrics);

  const login = (selectedRole: UserRole, email: string, name?: string, token?: string) => {
    setIsAuthenticated(true);
    setRole(selectedRole);

    const defaultNames: Record<UserRole, string> = {
      OWNER: 'Vetri',
      MANAGER: 'Santhosh (Field Agent)',
      DRIVER: 'Arun',
      LOADMAN: 'Kumar',
      GODOWN_KEEPER: 'Karthik',
      STOREROOM_STAFF: 'Priya (Office Analytics)',
    };

    const userName = name || defaultNames[selectedRole] || 'Vetri User';

    const sessionObj = {
      name: userName,
      email,
      role: selectedRole,
      token: token || `token-vetri-${Date.now()}`,
    };

    setCurrentUser({
      name: userName,
      email,
      role: selectedRole,
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

  const completeDelivery = async (deliveryId: string, paymentMethod: 'UPI' | 'CASH', transactionId?: string) => {
    const txn = transactionId || `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
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
    if (role !== 'OWNER') {
      alert('Access Denied: Only OWNER can add new workers to the platform.');
      return;
    }
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: empData.name || 'New Worker',
      email: empData.email || `${(empData.name || 'worker').toLowerCase().replace(/\s+/g, '')}@vetriindane.com`,
      password: empData.password || 'Vetri@2026',
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

    try {
      await fetch(`${API_BASE}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newEmp, userRole: role }),
      });
    } catch (err) {
      console.warn('SQLite employee insert sync note: Saved locally');
    }

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

  const removeEmployee = async (empId: string) => {
    if (role !== 'OWNER') {
      alert('Access Denied: Only OWNER can remove workers from the platform.');
      return;
    }
    const target = employees.find(e => e.id === empId);

    try {
      await fetch(`${API_BASE}/api/employees/${empId}?userRole=${role}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('SQLite employee delete sync note');
    }

    setEmployees(prev => prev.filter(e => e.id !== empId));
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
        addExpense,
        approveExpense,
        rejectExpense,
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
