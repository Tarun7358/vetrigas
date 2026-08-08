import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { soundAlerts } from '../utils/audioAlerts';
import {
  Users,
  CheckCircle2,
  Truck,
  Package,
  CircleDollarSign,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Volume2,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardPageProps {
  onNavigate: (tab: string, targetId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { vehicles, deliveries, currentUser, role } = useApp();

  const totalWorkers = 28;
  const presentToday = 25;
  const activeVehicles = vehicles.filter(v => v.status === 'MOVING' || v.status === 'STOPPED').length;
  const completedDeliveriesCount = deliveries.filter(d => d.status === 'DELIVERED').length;
  const todayCollection = 113650;

  // Inventory Stock Threshold (< 50 units trigger audible warning)
  const currentEmptyCylinderStock = 42; // Low stock alert threshold
  const isStockLow = currentEmptyCylinderStock < 50;

  // Overspeed & Idle Fleet Warnings
  const overspeedingVehicles = vehicles.filter(v => v.speed > 60);
  const idleIgnitionVehicles = vehicles.filter(v => v.speed === 0 && v.ignition);

  useEffect(() => {
    if (isStockLow && (role === 'OWNER' || role === 'MANAGER')) {
      soundAlerts.playLowStockAlert();
    }
    if (overspeedingVehicles.length > 0 && (role === 'OWNER' || role === 'MANAGER')) {
      soundAlerts.playSpeedAlert();
    }
  }, [isStockLow, overspeedingVehicles.length, role]);

  // Chart Data
  const hourlyData = [
    { time: '08:00', deliveries: 12, loading: 40 },
    { time: '10:00', deliveries: 35, loading: 85 },
    { time: '12:00', deliveries: 68, loading: 150 },
    { time: '14:00', deliveries: 110, loading: 195 },
    { time: '16:00', deliveries: 155, loading: 218 },
    { time: '18:00', deliveries: 184, loading: 218 },
  ];

  const fleetStatusData = [
    { name: 'Moving', value: 6, color: '#10B981' },
    { name: 'Stopped', value: 2, color: '#F59E0B' },
    { name: 'Offline', value: 1, color: '#EF4444' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Real-Time Sound & Push Alert Banner */}
      {isStockLow && (role === 'OWNER' || role === 'MANAGER') && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-xs text-white flex items-center gap-2">
                🚨 CRITICAL DEPOT STOCK WARNING: Empty Cylinder Stock Low ({currentEmptyCylinderStock} Units)
              </p>
              <p className="text-[11px] text-rose-300/80">
                Stock is below safety threshold (50 Cylinders). Dispatch refilling truck to Indian Oil Peelamedu Bottling Plant.
              </p>
            </div>
          </div>

          <button
            onClick={() => soundAlerts.playLowStockAlert()}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer self-start sm:self-auto"
          >
            <Volume2 className="w-4 h-4" /> Test Stock Sound Alert
          </button>
        </div>
      )}

      {/* Fleet Overspeed & Idle Ignition Warning Banner */}
      {idleIgnitionVehicles.length > 0 && (role === 'OWNER' || role === 'MANAGER') && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-xs text-white flex items-center gap-2">
                ⚠️ FLEET SAFETY ALERT: {idleIgnitionVehicles.length} Vehicle(s) Stopped with Ignition ON
              </p>
              <p className="text-[11px] text-amber-300/80">
                Vehicles {idleIgnitionVehicles.map(v => v.registrationNumber).join(', ')} are idling with engine running for &gt;15 mins.
              </p>
            </div>
          </div>

          <button
            onClick={() => soundAlerts.playSpeedAlert()}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer self-start sm:self-auto"
          >
            <Volume2 className="w-4 h-4" /> Test Fleet Sound Alert
          </button>
        </div>
      )}

      {/* Top Banner: Greeting + Date */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="font-display font-bold text-xl text-white">
              Good Morning, {currentUser?.name || (role === 'OWNER' ? 'Vetri' : role)}
            </h1>
            <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded uppercase">
              {role} Portal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'OWNER' && 'Vetri Executive Control Room • Full Depot Operations & Approvals'}
            {role === 'MANAGER' && 'Operations Management Console • Fleet Live Tracking & Batch Control'}
            {role === 'DRIVER' && 'Driver Logistics Console • Assigned Delivery Routes & Payment Collection'}
            {role === 'LOADMAN' && 'Depot Loading Operations Board • Cylinder Stock & Discrepancy Audits'}
          </p>
        </div>
        <div className="mt-3 md:mt-0 text-left md:text-right bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
          <p className="font-display font-extrabold text-sm text-amber-400">08 August 2026</p>
          <p className="text-[11px] font-semibold text-slate-400">Saturday • Shift 01 Active</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Workers */}
        <div className="kpi-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">TOTAL WORKERS</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="kpi-value">{totalWorkers}</div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">20 Drivers • 8 Loadmen</p>
        </div>

        {/* Present Today */}
        <div className="kpi-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">PRESENT TODAY</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="kpi-value text-emerald-600">{presentToday}</div>
          <p className="text-[11px] text-emerald-600 mt-1 font-semibold">92.8% Attendance Rate</p>
        </div>

        {/* Active Vehicles */}
        <div className="kpi-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">ACTIVE VEHICLES</span>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="kpi-value text-slate-900">{activeVehicles}</div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">6 Moving • 2 Stopped • 1 Off</p>
        </div>

        {/* Deliveries */}
        <div className="kpi-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">DELIVERIES</span>
            <Package className="w-4 h-4 text-purple-500" />
          </div>
          <div className="kpi-value text-purple-700">{completedDeliveriesCount}</div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">92% Daily Target Completed</p>
        </div>

        {/* Today's Collection */}
        <div className="kpi-card col-span-1 sm:col-span-2 md:col-span-1 border-amber-200 bg-amber-50/40">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider">TODAY'S COLLECTION</span>
            <CircleDollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="kpi-value text-amber-700">₹{todayCollection.toLocaleString('en-IN')}</div>
          <p className="text-[11px] text-amber-800 mt-1 font-semibold">₹82.4k UPI • ₹31.2k Cash</p>
        </div>
      </div>

      {/* Operational Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Operations Progress */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-display font-bold text-base text-slate-900">Today's Operations Progress</h2>
              <p className="text-xs text-slate-500">Real-time dispatch and loading telemetry</p>
            </div>
            <span className="badge-status badge-green flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Sync
            </span>
          </div>

          {/* Loading Progress */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700">Loading Progress</span>
              <span className="text-amber-600 font-mono">218 / 250 cylinders (87%)</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill bg-amber-500" style={{ width: '87%' }}></div>
            </div>
          </div>

          {/* Delivery Progress */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700">Delivery Progress</span>
              <span className="text-emerald-600 font-mono">184 / 200 cylinders (91%)</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill bg-emerald-500" style={{ width: '91%' }}></div>
            </div>
          </div>

          {/* Hourly Operations Chart */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Cylinder Velocity Timeline (Today)
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', border: 'none' }}
                  />
                  <Bar dataKey="loading" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Cylinders Loaded" />
                  <Bar dataKey="deliveries" fill="#10B981" radius={[4, 4, 0, 0]} name="Cylinders Delivered" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Fleet Quick Status & Reconciliation Alert Card */}
        <div className="space-y-6">
          {/* Fleet Distribution Pie */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm text-slate-900">Fleet Status Overview</h3>
              <button
                onClick={() => onNavigate('fleet')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View Live Map <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fleetStatusData} dataKey="value" innerRadius={25} outerRadius={45} paddingAngle={4}>
                      {fleetStatusData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 text-xs flex-1 pl-4">
                <div className="flex justify-between items-center bg-emerald-50 p-2 rounded border border-emerald-200">
                  <span className="font-semibold text-emerald-800">● Moving</span>
                  <span className="font-bold text-emerald-900">6 Vehicles</span>
                </div>
                <div className="flex justify-between items-center bg-amber-50 p-2 rounded border border-amber-200">
                  <span className="font-semibold text-amber-800">● Stopped</span>
                  <span className="font-bold text-amber-900">2 Vehicles</span>
                </div>
                <div className="flex justify-between items-center bg-rose-50 p-2 rounded border border-rose-200">
                  <span className="font-semibold text-rose-800">● Offline</span>
                  <span className="font-bold text-rose-900">1 Vehicle</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Mismatch Alert Box */}
          <div className="bg-rose-950/90 border border-rose-800 text-white rounded-xl p-5 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                <span>Daily Cash Mismatch Alert</span>
              </div>
              <span className="bg-rose-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                Action Req.
              </span>
            </div>

            <div className="mt-3 text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>Expected Total:</span>
                <span className="font-mono text-white font-semibold">₹1,15,420</span>
              </div>
              <div className="flex justify-between">
                <span>UPI Collected:</span>
                <span className="font-mono text-white font-semibold">₹82,450</span>
              </div>
              <div className="flex justify-between text-rose-300 font-bold border-t border-rose-900 pt-1 mt-1">
                <span>Cash Difference Mismatch:</span>
                <span className="font-mono text-rose-400 text-sm">₹470 ⚠️</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('billing')}
              className="w-full mt-4 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
            >
              Open Cash Reconciliation Desk <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
