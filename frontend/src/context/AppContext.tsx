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
  const [expenses, setExpenses] = useState<VehicleExpense[]>(initialExpenses);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>('v1');

  const addExpense = (expenseData: Omit<VehicleExpense, 'id' | 'date' | 'status'>) => {
    const newExp: VehicleExpense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PENDING',
    };
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

  const approveExpense = (expenseId: string) => {
    setExpenses(prev =>
      prev.map(e => (e.id === expenseId ? { ...e, status: 'APPROVED', approvedBy: currentUser?.name || role } : e))
    );
  };

  const rejectExpense = (expenseId: string) => {
    setExpenses(prev =>
      prev.map(e => (e.id === expenseId ? { ...e, status: 'REJECTED' } : e))
    );
  };
  
  const [reconciliation, setReconciliation] = useState<CashReconciliation>(vetriDataset.reconciliation as CashReconciliation);
  const [inventory] = useState<InventoryMetrics>(vetriDataset.inventory as InventoryMetrics);

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
