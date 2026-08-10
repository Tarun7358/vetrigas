import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { API_BASE } from '../utils/api';
import {
  Radio,
  Fingerprint,
  Play,
  Pause,
  Zap,
  CheckCircle2,
  Truck,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundAlerts } from '../utils/audioAlerts';

export const LiveSimulatorControl: React.FC<{ defaultExpanded?: boolean }> = ({ defaultExpanded = false }) => {
  const { employees, vehicles } = useApp();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isAutoGpsRunning, setIsAutoGpsRunning] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [isPunching, setIsPunching] = useState(false);
  const [isSteppingGps, setIsSteppingGps] = useState(false);
  const [lastScanMessage, setLastScanMessage] = useState<string | null>(null);

  // Poll simulator status from Express backend
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/simulator/status`);
        if (res.ok) {
          const data = await res.json();
          setIsAutoGpsRunning(Boolean(data.isSimulatorRunning));
        }
      } catch (e) {}
    };
    checkStatus();
  }, []);

  // Toggle Automated Live GPS Telemetry Stream
  const handleToggleAutoGps = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/simulator/toggle-auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isAutoGpsRunning }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsAutoGpsRunning(data.isSimulatorRunning);
        if (data.isSimulatorRunning) {
          soundAlerts.playSuccessSyncChime();
        }
      }
    } catch (err) {
      alert('Backend connection error.');
    }
  };

  // Step GPS coordinates manually (1 tick)
  const handleStepGps = async () => {
    try {
      setIsSteppingGps(true);
      const res = await fetch(`${API_BASE}/api/simulator/gps-step`, { method: 'POST' });
      if (res.ok) {
        soundAlerts.playSuccessSyncChime();
      }
    } catch (err) {
      console.warn('GPS Step error');
    } finally {
      setTimeout(() => setIsSteppingGps(false), 500);
    }
  };

  // Trigger Biometric Attendance Punch for Selected Existing User
  const handleBiometricPunch = async (empIdTarget?: string) => {
    const targetId = empIdTarget || selectedEmpId || (employees[0]?.id || 'emp-01');
    const targetEmp = employees.find(e => e.id === targetId || e.email.toLowerCase() === targetId.toLowerCase()) || employees[0];

    try {
      setIsPunching(true);
      const res = await fetch(`${API_BASE}/api/simulator/biometric-punch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: targetEmp ? targetEmp.id : targetId, employeeName: targetEmp?.name }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastScanMessage(data.message || `Biometric punch verified for ${targetEmp?.name}`);
        soundAlerts.playSuccessSyncChime();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
      }
    } catch (err) {
      alert('Biometric scanner simulation error.');
    } finally {
      setTimeout(() => setIsPunching(false), 800);
    }
  };

  // Clock in all existing users simultaneously
  const handleClockInAll = async () => {
    setIsPunching(true);
    for (const emp of employees) {
      try {
        await fetch(`${API_BASE}/api/simulator/biometric-punch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: emp.id, employeeName: emp.name }),
        });
      } catch (e) {}
    }
    soundAlerts.playSuccessSyncChime();
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.7 } });
    setLastScanMessage(`✓ Biometric attendance recorded for ALL ${employees.length} active workers!`);
    setIsPunching(false);
  };

  return (
    <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl text-white shadow-xl overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-extrabold text-sm text-amber-400">
                Real-Time Hardware Telemetry Engine
              </h3>
              {isAutoGpsRunning ? (
                <span className="badge-status badge-green text-[10px] font-bold flex items-center gap-1 py-0.5 px-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> ● LIVE STREAM ACTIVE
                </span>
              ) : (
                <span className="badge-status badge-amber text-[10px] font-bold py-0.5 px-2">
                  ● PAUSED
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Live IoT Fleet GPS telemetry movement & ZKTeco easyTimePro Biometric punches with existing users
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-700 cursor-pointer"
        >
          {isExpanded ? 'Collapse ▲' : 'Open Controls ▼'}
        </button>
      </div>

      {/* Expanded Control Panels */}
      {isExpanded && (
        <div className="p-5 space-y-5 bg-slate-900/90 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. REAL-TIME GPS TELEMETRY CONTROL */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span>Real-Time Fleettrack GPS Telemetry</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Peelamedu, CBE</span>
              </div>

              <p className="text-slate-400 text-[11px]">
                Real-time truck movement along Peelamedu & Avinashi Road routes for {vehicles.length} active fleet vehicles.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleToggleAutoGps}
                  className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                    isAutoGpsRunning
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  }`}
                >
                  {isAutoGpsRunning ? (
                    <>
                      <Pause className="w-4 h-4" /> Stop Live GPS Loop
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> Start Live GPS Loop (2.5s)
                    </>
                  )}
                </button>

                <button
                  onClick={handleStepGps}
                  disabled={isSteppingGps}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap className={`w-4 h-4 ${isSteppingGps ? 'animate-spin' : ''}`} /> 1-Click GPS Step
                </button>
              </div>

              {/* Active Simulated Trucks */}
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1 text-slate-300 font-mono">
                <p className="font-bold text-slate-400 text-[10px] uppercase font-sans">Tracked Fleet Vehicles:</p>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {vehicles.map(v => (
                    <div key={v.id} className="flex justify-between bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="font-bold text-amber-400">{v.registrationNumber}</span>
                      <span className="text-emerald-400">{v.driverName} ({v.speed}km/h)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. MOCK BIOMETRIC ATTENDANCE SCANNER */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  <span>Biometric Fingerprint Attendance Scanner</span>
                </div>
                <span className="text-[10px] text-blue-400 font-bold font-mono">ZKTeco easyTimePro</span>
              </div>

              <p className="text-slate-400 text-[11px]">
                Select an existing user to punch instant biometric hardware check-in attendance into SQLite database.
              </p>

              <div className="space-y-2">
                <select
                  value={selectedEmpId}
                  onChange={e => setSelectedEmpId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:border-emerald-400 focus:outline-none"
                >
                  <option value="">Select Existing User to Clock In...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role}) — {emp.email}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleBiometricPunch()}
                    disabled={isPunching}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Fingerprint className={`w-4 h-4 ${isPunching ? 'animate-bounce' : ''}`} />
                    Scan Fingerprint
                  </button>

                  <button
                    onClick={handleClockInAll}
                    disabled={isPunching}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Users className="w-4 h-4" /> Clock In All ({employees.length})
                  </button>
                </div>
              </div>

              {lastScanMessage && (
                <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 p-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{lastScanMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
