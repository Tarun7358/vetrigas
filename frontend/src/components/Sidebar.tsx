import React from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  CircleDollarSign,
  Truck,
  Video,
  PackageCheck,
  TruckIcon,
  Receipt,
  Boxes,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workforce', label: 'Workforce', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'payroll', label: 'Payroll', icon: CircleDollarSign },
    { id: 'fleet', label: 'Fleet & Map', icon: Truck },
    { id: 'camera', label: 'Vehicle Camera', icon: Video },
    { id: 'loading', label: 'Loading Control', icon: PackageCheck },
    { id: 'deliveries', label: 'Deliveries', icon: TruckIcon },
    { id: 'billing', label: 'Billing & E-Bill', icon: Receipt },
    { id: 'inventory', label: 'Cylinder Inventory', icon: Boxes },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'reports', label: 'Reports Hub', icon: FileSpreadsheet },
    { id: 'issues', label: 'Issues & Alerts', icon: AlertCircle },
    { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Dark Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 flex flex-col justify-between z-50 shrink-0
          fixed md:static inset-y-0 left-0
          ${mobileOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          ${collapsed ? 'md:w-16' : 'md:w-64'}
        `}
      >
        <div className="py-4 overflow-y-auto">
          {/* Header Controls inside Sidebar */}
          <div className="px-3 mb-4 flex items-center justify-between">
            {(!collapsed || mobileOpen) && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
                MAIN MENU
              </span>
            )}
            
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:block p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors mx-auto"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Mobile Close Toggle */}
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 px-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isIconOnly = collapsed && !mobileOpen;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                  title={isIconOnly ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  {(!collapsed || mobileOpen) && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        {(!collapsed || mobileOpen) && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-center text-[11px] text-slate-500">
            <p className="font-semibold text-slate-400">Vetri Indane Enterprise</p>
            <p className="mt-0.5">v2.4.0 • Built by RDK</p>
          </div>
        )}
      </aside>
    </>
  );
};

