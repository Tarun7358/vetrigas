import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { CriticalAlertDrawer } from './components/CriticalAlertDrawer';
import { LoginPage } from './pages/LoginPage';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { FleetPage } from './pages/FleetPage';
import { CameraPage } from './pages/CameraPage';
import { WorkforcePage } from './pages/WorkforcePage';
import { AttendancePage } from './pages/AttendancePage';
import { PayrollPage } from './pages/PayrollPage';
import { LoadingPage } from './pages/LoadingPage';
import { DeliveriesPage } from './pages/DeliveriesPage';
import { BillingPage } from './pages/BillingPage';
import { InventoryPage } from './pages/InventoryPage';
import { PerformancePage } from './pages/PerformancePage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ExpensesPage } from './pages/ExpensesPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, role, setSelectedVehicleId } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [alertsOpen, setAlertsOpen] = useState<boolean>(false);

  // Automatically direct user to role-specific landing page upon login
  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'LOADMAN') {
        setActiveTab('loading');
      } else if (role === 'DRIVER') {
        setActiveTab('deliveries');
      } else if (role === 'MANAGER') {
        setActiveTab('fleet');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [role, isAuthenticated]);

  const handleNavigate = (tab: string, targetId?: string) => {
    setActiveTab(tab);
    if (tab === 'fleet' && targetId) {
      setSelectedVehicleId(targetId);
    }
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenSearch={() => setSearchOpen(true)}
        onOpenAlerts={() => setAlertsOpen(true)}
        sidebarOpen={mobileOpen}
        setSidebarOpen={setMobileOpen}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 text-slate-800">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
            {activeTab === 'workforce' && <WorkforcePage />}
            {activeTab === 'attendance' && <AttendancePage />}
            {activeTab === 'payroll' && <PayrollPage />}
            {activeTab === 'expenses' && <ExpensesPage />}
            {activeTab === 'fleet' && <FleetPage onNavigate={handleNavigate} />}
            {activeTab === 'camera' && <CameraPage />}
            {activeTab === 'loading' && <LoadingPage />}
            {activeTab === 'deliveries' && <DeliveriesPage />}
            {activeTab === 'billing' && <BillingPage />}
            {activeTab === 'inventory' && <InventoryPage />}
            {activeTab === 'performance' && <PerformancePage />}
            {activeTab === 'reports' && <ReportsPage />}
            {activeTab === 'issues' && <DashboardPage onNavigate={handleNavigate} />}
            {activeTab === 'audit' && <AuditLogsPage />}
            {activeTab === 'settings' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="font-display font-bold text-lg text-slate-900">Platform Settings</h2>
                <p className="text-xs text-slate-500 mt-1">Vetri Indane Enterprise Configuration (RDK Technologies)</p>
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                  <p><strong>System Version:</strong> v2.4.0 (Production Build)</p>
                  <p><strong>Technology Partner:</strong> RDK Technologies</p>
                  <p><strong>Client Organization:</strong> Vetri Indane LPG Distribution</p>
                  <p><strong>Development Fee Standard:</strong> ₹1,80,000</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleNavigate}
      />
      <CriticalAlertDrawer
        isOpen={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
