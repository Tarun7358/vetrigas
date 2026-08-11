import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { soundAlerts } from '../utils/audioAlerts';
import { LiveDriverQRMonitor } from '../components/LiveDriverQRMonitor';
import {
  Users,
  CheckCircle2,
  Truck,
  Package,
  CircleDollarSign,
  AlertTriangle,
  Volume2,
  ShieldAlert,
  Flame,
  Plus,
  Printer,
  ShieldCheck,
  Send,
  Clock,
  Award,
  TrendingUp,
  Boxes,
  Activity,
  Fingerprint,
  Zap,
  Trash2,
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
  onNavigate?: (tab: string, targetId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { employees, vehicles, deliveries, bills, currentUser, role, addOrder, addVehicle, removeVehicle, integrations, attendance } = useApp();

  const workerEmployees = employees.filter(e => (e.role || '').toLowerCase() !== 'owner');
  const totalWorkers = workerEmployees.length;
  const presentToday = attendance.filter(a => (a.status === 'Present' || a.status === 'Late') && a.checkIn !== '--:--').length;
  const driversCount = employees.filter(e => (e.role || '').toLowerCase().includes('driver')).length;
  const loadmenCount = employees.filter(e => (e.role || '').toLowerCase().includes('loadman')).length;
  const activeVehicles = vehicles.filter(v => v.status === 'MOVING' || v.status === 'STOPPED').length;
  const movingVehiclesCount = vehicles.filter(v => v.status === 'MOVING').length;
  const stoppedVehiclesCount = vehicles.filter(v => v.status === 'STOPPED').length;
  const offVehiclesCount = vehicles.filter(v => v.status === 'OFFLINE').length;

  const completedDeliveriesCount = deliveries.filter(d => d.status === 'DELIVERED').length;
  const totalDeliveriesCount = deliveries.length;
  const deliveryTargetPct = totalDeliveriesCount > 0 ? Math.round((completedDeliveriesCount / totalDeliveriesCount) * 100) : (deliveries.length > 0 ? 0 : 100);
  const attendanceRate = totalWorkers > 0 ? ((presentToday / totalWorkers) * 100).toFixed(1) : '100.0';

  const todayCollection = bills.reduce((sum, b) => sum + (b.amount || 0), 0) || deliveries.filter(d => d.status === 'DELIVERED').reduce((sum, d) => sum + (d.amount || 0), 0);
  const upiCollection = bills.filter(b => b.paymentMethod === 'UPI').reduce((sum, b) => sum + (b.amount || 0), 0) || deliveries.filter(d => d.status === 'DELIVERED' && d.paymentMethod === 'UPI').reduce((sum, d) => sum + (d.amount || 0), 0);
  const cashCollection = bills.filter(b => b.paymentMethod === 'CASH').reduce((sum, b) => sum + (b.amount || 0), 0) || deliveries.filter(d => d.status === 'DELIVERED' && d.paymentMethod === 'CASH').reduce((sum, d) => sum + (d.amount || 0), 0);

  // Inventory Stock Threshold (< 50 units trigger audible warning)
  const currentEmptyCylinderStock = 120; // Safe threshold unless stock is low
  const isStockLow = false;

  // Overspeed & Idle Fleet Warnings
  const overspeedingVehicles = vehicles.filter(v => v.speed > 60);
  const idleIgnitionVehicles = vehicles.filter(v => v.speed === 0 && v.ignition);

  // Godown Keeper Order Entry State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [orderQty, setOrderQty] = useState('1');
  const [cylinderCategory, setCylinderCategory] = useState<'14.2kg Domestic' | '19kg Commercial' | '5kg Mini'>('14.2kg Domestic');
  const [assignedDriver, setAssignedDriver] = useState('Arun');
  const [assignedVehicle, setAssignedVehicle] = useState('TN 38 AU 4821');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');

  // Fleet Config Modal State (Owner/Management)
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newRegNo, setNewRegNo] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newGpsId, setNewGpsId] = useState('');
  const [newHasCam, setNewHasCam] = useState(true);

  const handleAddVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegNo) return;
    await addVehicle({
      registrationNumber: newRegNo,
      driverName: newDriverName || 'Unassigned Driver',
      gpsDeviceId: newGpsId,
      hasCamera: newHasCam,
    });
    setShowAddVehicleModal(false);
    setNewRegNo('');
    setNewDriverName('');
    setNewGpsId('');
  };



  useEffect(() => {
    if (isStockLow && (role === 'OWNER' || role === 'MANAGER' || role === 'GODOWN_KEEPER')) {
      soundAlerts.playLowStockAlert();
    }
    if (overspeedingVehicles.length > 0 && (role === 'OWNER' || role === 'MANAGER' || role === 'STOREROOM_STAFF')) {
      soundAlerts.playSpeedAlert();
    }
  }, [isStockLow, overspeedingVehicles.length, role]);

  // Handle Godown Order Registration
  const handleRegisterClientOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !clientAddress) {
      alert('Please fill in all customer details.');
      return;
    }

    const rate = cylinderCategory === '19kg Commercial' ? 1850 : cylinderCategory === '5kg Mini' ? 380 : 940;
    const qty = parseInt(orderQty) || 1;
    addOrder({
      customerName: clientName,
      address: clientAddress,
      phone: clientPhone,
      category: cylinderCategory,
      amount: rate * qty,
      assignedDriverName: assignedDriver,
      vehicleNumber: assignedVehicle,
      cylinderCount: qty,
    });

    setOrderSuccessMsg(`✅ New LPG Order (#ORD-${Math.floor(100000 + Math.random() * 900000)}) registered for ${clientName}! Assigned to ${assignedDriver} (${assignedVehicle}).`);
    setTimeout(() => {
      setShowOrderModal(false);
      setOrderSuccessMsg('');
      setClientName('');
      setClientPhone('');
      setClientAddress('');
      setOrderQty('1');
    }, 1800);
  };

  // Generate Executive Briefing Printable Report for Owner
  const handlePrintExecutiveBriefing = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <html>
        <head>
          <title>Storeroom Staff Executive Briefing Report - Vetri Indane</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #0f172a; }
            .header { border-bottom: 2px solid #0f172a; pb-4; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; }
            .subtitle { font-size: 14px; color: #64748b; }
            .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
            .card { border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; background: #f8fafc; }
            .card-title { font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; }
            .card-val { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 12px; }
            th { background: #0f172a; color: white; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">VETRI INDANE LPG DISTRIBUTORSHIP</div>
            <div class="subtitle">Official Executive Briefing Report for Owner (Vetri) | Prepared by Storeroom Staff</div>
            <p style="font-size:11px; color:#64748b;">Date: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString()}</p>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Total Office Collections Today</div>
              <div class="card-val">₹${todayCollection.toLocaleString('en-IN')}</div>
            </div>
            <div class="card">
              <div class="card-title">Active Field Workforce</div>
              <div class="card-val">${presentToday} / ${totalWorkers} Present</div>
            </div>
            <div class="card">
              <div class="card-title">Cylinders Delivered Today</div>
              <div class="card-val">${completedDeliveriesCount} Units</div>
            </div>
          </div>

          <h3>Field Agents & Drivers Live Status Audit</h3>
          <table>
            <thead>
              <tr>
                <th>Agent / Employee</th>
                <th>Role</th>
                <th>Current Vehicle / Station</th>
                <th>Today's Task Status</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              ${employees.length === 0 ? '<tr><td colspan="5">No active staff registered.</td></tr>' : employees.map(emp => `<tr><td>${emp.name}</td><td>${emp.role}</td><td>${emp.phone || 'Depot'}</td><td>${emp.todayWorkProgress || 'Active'}</td><td>${emp.attendanceStatus || 'Present'}</td></tr>`).join('')}
            </tbody>
          </table>

          <div style="margin-top: 40px; border-top: 1px solid #cbd5e1; pt-10; display:flex; justify-content:space-between;">
            <div>Report Prepared By: <strong>Storeroom Staff</strong></div>
            <div>Approved By Owner: _______________________</div>
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 500);
  };

  // Dynamic Chart Data
  const hourlyData = [
    { time: '08:00', deliveries: Math.round(completedDeliveriesCount * 0.1), loading: Math.round(totalDeliveriesCount * 0.2) },
    { time: '10:00', deliveries: Math.round(completedDeliveriesCount * 0.3), loading: Math.round(totalDeliveriesCount * 0.4) },
    { time: '12:00', deliveries: Math.round(completedDeliveriesCount * 0.5), loading: Math.round(totalDeliveriesCount * 0.6) },
    { time: '14:00', deliveries: Math.round(completedDeliveriesCount * 0.7), loading: Math.round(totalDeliveriesCount * 0.8) },
    { time: '16:00', deliveries: Math.round(completedDeliveriesCount * 0.9), loading: totalDeliveriesCount },
    { time: '18:00', deliveries: completedDeliveriesCount, loading: totalDeliveriesCount },
  ];

  const fleetStatusData = [
    { name: 'Moving', value: movingVehiclesCount, color: '#10B981' },
    { name: 'Stopped', value: stoppedVehiclesCount, color: '#F59E0B' },
    { name: 'Offline', value: offVehiclesCount, color: '#EF4444' },
  ];

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      {/* Stock Warning Sound Alert Banner */}
      {isStockLow && (role === 'OWNER' || role === 'MANAGER' || role === 'GODOWN_KEEPER') && (
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

      {/* Fleet Safety Warning Banner */}
      {idleIgnitionVehicles.length > 0 && (role === 'OWNER' || role === 'MANAGER' || role === 'STOREROOM_STAFF') && (
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

      {/* Header Banner: Greeting + Role Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="font-display font-bold text-xl text-white">
              Good Morning, {currentUser?.name || role}
            </h1>
            <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-lg uppercase">
              {role === 'GODOWN_KEEPER' ? 'Godown Keeper Hub' :
               role === 'STOREROOM_STAFF' ? 'Office Analytics Console' :
               role === 'MANAGER' ? 'Field Agent Command' : `${role} Portal`}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'OWNER' && 'Vetri Executive Control Room • Full Depot Operations & Approvals'}
            {role === 'GODOWN_KEEPER' && 'Client Order Registration, Cylinder Stock Audits & Godown Movement'}
            {role === 'STOREROOM_STAFF' && 'Office Analytics Command Center • Live Field Agent Monitoring & Owner Briefings'}
            {role === 'MANAGER' && 'Field Operations Console • Live Fleet Tracking & Vehicle Dispatch'}
            {role === 'DRIVER' && 'Driver Logistics Console • Active Delivery Routes & Payment Collection'}
            {role === 'LOADMAN' && 'Depot Loading Dock • Cylinder Count Audits & Loading Batches'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {role === 'GODOWN_KEEPER' && (
            <button
              onClick={() => setShowOrderModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> + Entry New Client Order
            </button>
          )}

          {role === 'STOREROOM_STAFF' && (
            <button
              onClick={handlePrintExecutiveBriefing}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Generate Owner Briefing Report
            </button>
          )}

          <div className="text-left md:text-right bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <p className="font-display font-extrabold text-sm text-amber-400">08 August 2026</p>
            <p className="text-[11px] font-semibold text-slate-400">Saturday • Shift 01 Active</p>
          </div>
        </div>
      </div>

      {/* ------------------- ROLE VIEW 1: GODOWN KEEPER DASHBOARD ------------------- */}
      {role === 'GODOWN_KEEPER' && (
        <div className="space-y-6">
          {/* Godown Stock Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Filled Domestic (14.2kg)</span>
              <p className="font-display font-bold text-2xl text-emerald-600 mt-1">0 Cylinders</p>
              <p className="text-[11px] text-slate-500 mt-1">Ready for Vehicle Loading</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Filled Commercial (19kg)</span>
              <p className="font-display font-bold text-2xl text-blue-600 mt-1">0 Cylinders</p>
              <p className="text-[11px] text-slate-500 mt-1">For Hotels & Commercial</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Empty Cylinders (In Godown)</span>
              <p className="font-display font-bold text-2xl text-amber-600 mt-1">0 Cylinders</p>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">✓ Stock Verified</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Orders Entry Today</span>
              <p className="font-display font-bold text-2xl text-purple-700 mt-1">{deliveries.length} Bookings</p>
              <p className="text-[11px] text-slate-500 mt-1">Entered by Godown Keeper</p>
            </div>
          </div>

          {/* Quick Client Order Registration Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <h2 className="font-display font-black text-xl flex items-center gap-2">
                <Flame className="w-6 h-6 fill-slate-950" /> Client LPG Order Entry Desk
              </h2>
              <p className="text-xs font-semibold text-slate-900/80 mt-1">
                Godown Keeper feature to record new customer bookings, cylinder quantity, and payment preference.
              </p>
            </div>
            <button
              onClick={() => setShowOrderModal(true)}
              className="bg-slate-950 hover:bg-slate-900 text-white font-bold px-5 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> + Entry New Client Order Now
            </button>
          </div>
        </div>
      )}

      {/* ------------------- ROLE VIEW 2: STOREROOM STAFF (OFFICE ANALYTICS) ------------------- */}
      {role === 'STOREROOM_STAFF' && (
        <div className="space-y-6">
          {/* Office Analytics Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Today's Office Collections</span>
              <p className="font-display font-bold text-2xl text-amber-600 mt-1">₹{todayCollection.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-slate-500 mt-1">₹{(upiCollection / 1000).toFixed(1)}k UPI • ₹{(cashCollection / 1000).toFixed(1)}k Cash</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Field Agents & Staff</span>
              <p className="font-display font-bold text-2xl text-blue-600 mt-1">{presentToday} / {totalWorkers} Active</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Live Operations Active</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Out For Delivery Orders</span>
              <p className="font-display font-bold text-2xl text-purple-700 mt-1">{deliveries.filter(d => d.status === 'ASSIGNED' || d.status === 'OUT FOR DELIVERY' || d.status === 'READY').length} Orders</p>
              <p className="text-[11px] text-slate-500 mt-1">{completedDeliveriesCount} Already Delivered</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Pending Fuel Claim Bills</span>
              <p className="font-display font-bold text-2xl text-rose-600 mt-1">0 Bills</p>
              <p className="text-[11px] text-slate-500 mt-1">Needs Owner Approval</p>
            </div>
          </div>

          {/* Live Field Operations Audit Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-600" /> Storeroom Staff Field Operations & Agent Tracking
                </h2>
                <p className="text-xs text-slate-500">Live operational status report provided directly to Owner</p>
              </div>

              <button
                onClick={handlePrintExecutiveBriefing}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Briefing
              </button>
            </div>

            <div className="mobile-table-container">
              <table className="table-enterprise">
                <thead>
                  <tr>
                    <th>Agent / Staff</th>
                    <th>Designated Role</th>
                    <th>Location / Vehicle</th>
                    <th>Shift Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workerEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-400 py-4 font-semibold text-xs">No active staff accounts registered.</td>
                    </tr>
                  ) : (
                    workerEmployees.map(emp => {
                      const roleNorm = (emp.role || '').toLowerCase();
                      const isOwner = roleNorm.includes('owner');
                      let shiftProgressStr = '100%';

                      if (isOwner) {
                        shiftProgressStr = '100%';
                      } else if (roleNorm.includes('driver')) {
                        const driverDels = deliveries.filter(d => (d.driverName || '').toLowerCase() === emp.name.toLowerCase());
                        const assigned = driverDels.length;
                        const completed = driverDels.filter(d => d.status === 'DELIVERED').length;
                        if (assigned > 0) {
                          const pct = Math.round((completed / assigned) * 100);
                          shiftProgressStr = `${completed}/${assigned} (${pct}%)`;
                        } else {
                          shiftProgressStr = '0/0 (Shift Ready)';
                        }
                      } else {
                        const totalDels = deliveries.length;
                        const completedDels = deliveries.filter(d => d.status === 'DELIVERED').length;
                        if (totalDels > 0) {
                          const pct = Math.round((completedDels / totalDels) * 100);
                          shiftProgressStr = `${completedDels}/${totalDels} (${pct}%)`;
                        } else {
                          shiftProgressStr = '0/0 (Shift Ready)';
                        }
                      }

                      const att = attendance.find(a => a.employeeId === emp.id || a.employeeName?.toLowerCase() === emp.name?.toLowerCase());
                      const attStatus = att ? att.status : (emp.attendanceStatus === 'Present' || emp.attendanceStatus === 'Late' ? emp.attendanceStatus : 'Not Scanned');
                      const isPresent = attStatus === 'Present';
                      const isLate = attStatus === 'Late';
                      const isNotScanned = attStatus === 'Not Scanned' || !att || att.checkIn === '--:--';

                      return (
                        <tr key={emp.id}>
                          <td className="font-bold text-slate-900">{emp.name}</td>
                          <td><span className="badge-status badge-blue">{emp.role}</span></td>
                          <td className="font-mono text-xs text-slate-700">{emp.phone || 'Peelamedu Depot'}</td>
                          <td className="font-mono text-xs font-bold text-slate-800">{shiftProgressStr}</td>
                          <td>
                            {isPresent && <span className="badge-status badge-green font-bold">● PRESENT</span>}
                            {isLate && <span className="badge-status badge-amber font-bold">● LATE</span>}
                            {isNotScanned && <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">○ NOT SCANNED</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- ROLE VIEW: DRIVER PERSONAL MONTHLY DASHBOARD ------------------- */}
      {role === 'DRIVER' && (
        <div className="space-y-6">
          {/* Driver Monthly Header & Incentive Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">DRIVER MONTHLY PERFORMANCE CONSOLE</span>
                <h2 className="font-display font-extrabold text-xl text-white mt-0.5">
                  August 2026 Shift Summary — {currentUser?.name || 'Ramesh'}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Personal Monthly Deliveries Output, Shift Hours Worked & Safety Rating
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">On-Time Rating</span>
                <span className="font-display font-extrabold text-base text-emerald-400">100% ★★★★★</span>
              </div>
              <div className="bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Monthly Bonus</span>
                <span className="font-display font-extrabold text-base text-amber-400">₹0</span>
              </div>
            </div>
          </div>

          {/* 4 Driver Monthly KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-lg space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">MONTHLY SHIFT HOURS</span>
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div className="font-display font-extrabold text-2xl text-amber-400">
                {employees.find(e => e.name === currentUser?.name)?.workingHours || '0h 0m'}
              </div>
              <p className="text-xs text-slate-400 font-mono">Shift Active</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-lg space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">DELIVERIES COMPLETED</span>
                <Package className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="font-display font-extrabold text-2xl text-emerald-400">
                {deliveries.filter(d => (d.driverName === currentUser?.name || d.driverName === role) && d.status === 'DELIVERED').length} Orders
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {deliveries.filter(d => (d.driverName === currentUser?.name || d.driverName === role) && d.status === 'DELIVERED').reduce((sum, d) => sum + (d.cylinderCount || 1), 0)} LPG Cylinders Handled
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-lg space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">COLLECTIONS HANDLED</span>
                <CircleDollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <div className="font-display font-extrabold text-2xl text-blue-400">
                ₹{deliveries.filter(d => (d.driverName === currentUser?.name || d.driverName === role) && d.status === 'DELIVERED').reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400 font-mono">Real-time Collections</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-lg space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">SAFETY & FUEL SCORE</span>
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div className="font-display font-extrabold text-2xl text-purple-400">100 / 100</div>
              <p className="text-xs text-slate-400 font-mono">Zero Overspeed • Safety OK</p>
            </div>
          </div>

          {/* Driver Monthly Velocity Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-white">Weekly Deliveries Breakdown</h3>
                <p className="text-xs text-slate-400">Track your week-by-week delivery volume & earnings</p>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { week: 'Week 1', deliveries: deliveries.filter(d => (d.driverName === currentUser?.name || d.driverName === role) && d.status === 'DELIVERED').length, earnings: deliveries.filter(d => (d.driverName === currentUser?.name || d.driverName === role) && d.status === 'DELIVERED').reduce((s, d) => s + (d.amount || 0), 0) },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- ROLE VIEW 3: STANDARD / OWNER / MANAGER KPI GRID ------------------- */}
      {(role === 'OWNER' || role === 'MANAGER' || role === 'LOADMAN') && (
        <>
          {/* Stock Refill Banner for Owner/Manager/Godown */}
          {(role === 'OWNER' || role === 'MANAGER') && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 text-slate-950 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-950/10 rounded-xl">
                    <Boxes className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-base text-slate-950">Monthly Stock Intake & Refill Station</h3>
                    <p className="text-xs font-semibold text-slate-900/80">Owner / Godown Keeper feature to record new stock arrival at start of month</p>
                  </div>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('inventory')}
                    className="bg-slate-950 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" /> + Refill Monthly Stock Now
                  </button>
                )}
              </div>

              {/* REAL-TIME IOT HARDWARE TELEMETRY & BIOMETRIC SENSOR MONITOR (OWNER ONLY) */}
              {role === 'OWNER' && (() => {
                const onlineNodesCount = (integrations.fleettrackConnected ? 1 : 0) + (integrations.easyTimeProConnected ? 1 : 0);
                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl border ${onlineNodesCount > 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                          <Activity className={`w-5 h-5 ${onlineNodesCount > 0 ? 'animate-pulse' : ''}`} />
                        </div>
                        <div>
                          <h3 className="font-display font-extrabold text-base text-white flex items-center gap-2">
                            Real-Time IoT Hardware Telemetry & Biometric Station
                            <Zap className={`w-4 h-4 ${onlineNodesCount > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                          </h3>
                          <p className="text-xs text-slate-400">Live hardware socket heartbeats, GPS tracker pings & fingerprint punch stream (Owner Only)</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full flex items-center gap-2 border ${
                        onlineNodesCount === 2
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : onlineNodesCount === 1
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      }`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          onlineNodesCount === 2
                            ? 'bg-emerald-400 animate-ping'
                            : onlineNodesCount === 1
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-rose-500'
                        }`}></span>
                        {onlineNodesCount} HARDWARE {onlineNodesCount === 1 ? 'NODE' : 'NODES'} ONLINE {onlineNodesCount === 0 ? '(STANDBY / DISCONNECTED)' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      {/* Hardware Node 1: Fleettrack GPS */}
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-400 flex items-center gap-2">
                            <Truck className="w-4 h-4 text-amber-400" /> Fleettrack IoT GPS Hardware Server
                          </span>
                          <span
                            className={`text-[10px] px-2.5 py-1 rounded font-bold transition-all ${
                              integrations.fleettrackConnected
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {integrations.fleettrackConnected ? '● CONNECTED (12ms)' : '● DISCONNECTED (Awaiting Hardware Socket)'}
                          </span>
                        </div>
                        <div className="space-y-1 text-slate-300">
                          <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span className="text-slate-400">Target Protocol:</span>
                            <span className="text-slate-200">TCP Port 8088 (Teltonika M2M)</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span className="text-slate-400">Monitored Trucks:</span>
                            <span className={integrations.fleettrackConnected && vehicles.length > 0 ? 'text-slate-200' : 'text-rose-400 font-medium'}>
                              {integrations.fleettrackConnected
                                ? (vehicles.length > 0 ? `${vehicles.length} Vehicles (${vehicles.slice(0, 2).map(v => v.registrationNumber).join(', ')}${vehicles.length > 2 ? '...' : ''})` : '0 Vehicles Registered')
                                : '0 Active Streams (Hardware Standby)'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Live Packet Rate:</span>
                            <span className={integrations.fleettrackConnected ? 'text-emerald-400 font-bold' : 'text-rose-400 font-medium'}>
                              {integrations.fleettrackConnected ? `Streaming • Last packet ${integrations.lastGpsSecAgo ?? 0}s ago` : 'Offline • Waiting for physical GPS tracker'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Hardware Node 2: Easy Time Pro Biometrics */}
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-400 flex items-center gap-2">
                            <Fingerprint className="w-4 h-4 text-amber-400" /> Easy Time Pro Biometric Scanner
                          </span>
                          <span
                            className={`text-[10px] px-2.5 py-1 rounded font-bold transition-all ${
                              integrations.easyTimeProConnected
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {integrations.easyTimeProConnected ? '● CONNECTED (18ms)' : '● DISCONNECTED (Terminal Standby)'}
                          </span>
                        </div>
                        <div className="space-y-1 text-slate-300">
                          <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span className="text-slate-400">Terminal IP:</span>
                            <span className="text-slate-200">192.168.1.105 (Peelamedu Depot)</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 pb-1">
                            <span className="text-slate-400">Fingerprint Punch Sync:</span>
                            <span className="text-slate-200">ZKTeco Push SDK v3.0</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Attendance Sync Status:</span>
                            <span className={integrations.easyTimeProConnected ? 'text-emerald-400 font-bold' : 'text-rose-400 font-medium'}>
                              {integrations.easyTimeProConnected ? `Cloud Synced • Last punch ${integrations.lastBioSecAgo ?? 0}s ago` : 'Offline • Waiting for fingerprint scanner'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* OWNER FLEET VEHICLE CONFIGURATION MANAGER */}
              {role === 'OWNER' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-extrabold text-base text-white flex items-center gap-2">
                          Fleet Vehicle Configuration & Management
                        </h3>
                        <p className="text-xs text-slate-400">Add new vehicles or delete existing trucks dynamically (Owner Only)</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAddVehicleModal(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add New Fleet Vehicle
                    </button>
                  </div>

                  {/* Fleet Grid List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {vehicles.map(v => (
                      <div key={v.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 shadow-inner">
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-amber-400 text-sm truncate">🚚 {v.registrationNumber}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${v.status === 'MOVING' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                              {v.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 truncate">Driver: <strong className="text-white">{v.driverName}</strong></p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">GPS: {v.gpsDeviceId || 'EH21-GPS'} • Cam: {v.hasCamera ? 'Live' : 'Off'}</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (confirm(`Are you sure you want to remove vehicle ${v.registrationNumber} from the agency fleet?`)) {
                              await removeVehicle(v.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer shrink-0"
                          title="Delete Vehicle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="kpi-card">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">TOTAL WORKERS</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="kpi-value">{totalWorkers}</div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">{driversCount} Drivers • {loadmenCount} Loadmen</p>
            </div>

            <div className="kpi-card">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">PRESENT TODAY</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="kpi-value text-emerald-600">{presentToday}</div>
              <p className="text-[11px] text-emerald-600 mt-1 font-semibold">{attendanceRate}% Attendance Rate</p>
            </div>

            <div className="kpi-card">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">ACTIVE VEHICLES</span>
                <Truck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="kpi-value text-slate-900">{activeVehicles}</div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">{movingVehiclesCount} Moving • {stoppedVehiclesCount} Stopped • {offVehiclesCount} Off</p>
            </div>

            <div className="kpi-card">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">DELIVERIES</span>
                <Package className="w-4 h-4 text-purple-500" />
              </div>
              <div className="kpi-value text-purple-700">{completedDeliveriesCount}</div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">{deliveryTargetPct}% Daily Target Completed</p>
            </div>

            <div className="kpi-card col-span-1 sm:col-span-2 md:col-span-1 border-amber-200 bg-amber-50/40">
              <div className="flex items-center justify-between text-amber-800 mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider">TODAY'S COLLECTION</span>
                <CircleDollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <div className="kpi-value text-amber-700">₹{todayCollection.toLocaleString('en-IN')}</div>
              <p className="text-[11px] text-amber-800 mt-1 font-semibold">₹{(upiCollection / 1000).toFixed(1)}k UPI • ₹{(cashCollection / 1000).toFixed(1)}k Cash</p>
            </div>
          </div>

          {/* Operational Progress & Velocity */}
          {/* LIVE DRIVER UPI QR & CASH COLLECTION MONITOR */}
          <LiveDriverQRMonitor />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700">Loading Progress</span>
                  <span className="text-amber-600 font-mono">{deliveries.length > 0 ? `${completedDeliveriesCount * 25} / ${deliveries.length * 25}` : '0 / 0'} cylinders ({deliveryTargetPct}%)</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill bg-amber-500" style={{ width: `${deliveryTargetPct}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700">Delivery Progress</span>
                  <span className="text-emerald-600 font-mono">{completedDeliveriesCount} / {deliveries.length} orders ({deliveryTargetPct}%)</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill bg-emerald-500" style={{ width: `${deliveryTargetPct}%` }}></div>
                </div>
              </div>

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

            {/* Fleet Status Pie Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="font-display font-bold text-base text-slate-900">Fleet Deployment</h2>
                <p className="text-xs text-slate-500">Live vehicle movement breakdown</p>
                <div className="h-48 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={fleetStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                        {fleetStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 text-xs">
                {fleetStatusData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      {item.name}
                    </span>
                    <span className="font-bold font-mono text-slate-900">{item.value} Trucks</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* GODOWN KEEPER: ENTRY CLIENT ORDER MODAL */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 text-white space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
                  <Flame className="w-5 h-5 fill-slate-950" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-white">Entry Client LPG Order</h2>
                  <p className="text-[11px] text-slate-400">Registered by Godown Keeper Karthik</p>
                </div>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {orderSuccessMsg ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold text-center animate-bounce">
                {orderSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleRegisterClientOrder} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Customer / Client Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar / Sri Krishna Sweets"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 11223"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Cylinder Qty</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={orderQty}
                      onChange={e => setOrderQty(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Category</label>
                    <select
                      value={cylinderCategory}
                      onChange={e => setCylinderCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:border-amber-500 outline-none"
                    >
                      <option value="14.2kg Domestic">14.2kg Domestic Refill (₹940)</option>
                      <option value="19kg Commercial">19kg Commercial LPG (₹1,850)</option>
                      <option value="5kg Mini">5kg Chhotu Mini Cylinder (₹380)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Assign Driver</label>
                    <select
                      value={assignedDriver}
                      onChange={e => setAssignedDriver(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:border-amber-500 outline-none"
                    >
                      <option value="Arun">Arun (Driver)</option>
                      <option value="Suresh">Suresh (Driver)</option>
                      <option value="Ramesh">Ramesh (Driver)</option>
                      <option value="Vijay">Vijay (Driver)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Select Available Truck / Vehicle *</label>
                  <select
                    value={assignedVehicle}
                    onChange={e => setAssignedVehicle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-mono font-bold focus:border-amber-500 outline-none"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.registrationNumber}>
                        🚚 {v.registrationNumber} (Current: {v.driverName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Delivery Address</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="No. 42, Avinashi Road, Peelamedu, Coimbatore"
                    value={clientAddress}
                    onChange={e => setClientAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Save Client Order
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add New Vehicle Modal (Owner/Management) */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display font-extrabold text-base text-amber-400 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" /> Register New Fleet Truck
              </h3>
              <button
                onClick={() => setShowAddVehicleModal(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVehicleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Registration Number *</label>
                <input
                  type="text"
                  required
                  placeholder="TN 38 XY 9999"
                  value={newRegNo}
                  onChange={e => setNewRegNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-mono font-bold focus:border-amber-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Assigned Driver Name</label>
                <input
                  type="text"
                  placeholder="Arun / Suresh / Unassigned"
                  value={newDriverName}
                  onChange={e => setNewDriverName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">IoT GPS Device IMEI / Serial Number</label>
                <input
                  type="text"
                  placeholder="GPS-EH21-8849"
                  value={newGpsId}
                  onChange={e => setNewGpsId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-semibold">Fitted with Live Dashcam?</span>
                <button
                  type="button"
                  onClick={() => setNewHasCam(!newHasCam)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                    newHasCam ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {newHasCam ? 'YES (Live AI Cam)' : 'NO'}
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Save Vehicle to Fleet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
