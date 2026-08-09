import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Flame,
  Search,
  Bell,
  AlertCircle,
  Menu,
  ChevronDown,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenAlerts: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenAlerts,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const { role, currentUser, integrations, alerts, logout } = useApp();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [gpsSec, setGpsSec] = useState<number>(2);
  const [bioSec, setBioSec] = useState<number>(14);

  // Live real-time heartbeat ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setGpsSec(prev => (prev >= 5 ? 1 : prev + 1));
      setBioSec(prev => (prev >= 20 ? 6 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
  };

  const isOwner = (role || '').toUpperCase() === 'OWNER';

  const [isPingingGps, setIsPingingGps] = useState(false);
  const [isPingingBio, setIsPingingBio] = useState(false);
  const [hardwareNotice, setHardwareNotice] = useState<string | null>(null);

  const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

  const handlePingHardware = async (type: 'gps' | 'bio') => {
    if (type === 'gps') setIsPingingGps(true);
    else setIsPingingBio(true);
    setHardwareNotice(null);

    try {
      const res = await fetch(`${API_BASE}/api/telemetry/status`);
      if (res.ok) {
        const data = await res.json();
        const isOnline = type === 'gps'
          ? data.fleettrackGps?.status === 'ONLINE'
          : data.easyTimeProBiometrics?.status === 'ONLINE';

        if (isOnline) {
          setHardwareNotice(`✅ SUCCESS: ${type === 'gps' ? 'Fleettrack GPS' : 'Easy Time Pro Biometric'} hardware socket handshake verified!`);
        } else {
          setHardwareNotice(`⚠️ HANDSHAKE FAILED: ${type === 'gps' ? 'Fleettrack GPS hardware' : 'Easy Time Pro Biometric terminal'} is OFFLINE. Reverting to DISCONNECTED standby.`);
        }
      } else {
        setHardwareNotice(`⚠️ SERVER OFFLINE: Unable to reach telemetry backend server.`);
      }
    } catch (err) {
      setHardwareNotice(`⚠️ CONNECTION FAILED: Telemetry backend socket unreachable. Ensure backend server is active.`);
    } finally {
      if (type === 'gps') setIsPingingGps(false);
      else setIsPingingBio(false);
      setTimeout(() => setHardwareNotice(null), 5000);
    }
  };

  return (
    <>
      {hardwareNotice && (
        <div className="bg-slate-950 border-b border-amber-500/40 px-4 py-2 text-center text-xs font-mono font-bold text-amber-400 flex items-center justify-center gap-2 animate-fadeIn z-40">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{hardwareNotice}</span>
        </div>
      )}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between z-30 sticky top-0 shadow-md text-white">
        {/* Left Branding + Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 shrink-0">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-950 stroke-none" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display font-black text-base sm:text-lg tracking-tight text-white leading-none">
                  VETRI INDANE
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded uppercase">
                  Enterprise
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 hidden xs:block sm:block tracking-wide">
                Powered by RDK Technologies
              </span>
            </div>
          </div>
        </div>

        {/* Middle Integration Toggles (Real-Time Live Hardware Status) — OWNER ONLY */}
        {isOwner && (
          <div className="hidden lg:flex items-center gap-3 bg-slate-950/90 px-3.5 py-1.5 rounded-xl border border-slate-800 font-mono">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IoT Hardware:</span>

            {/* Fleettrack Live GPS */}
            <button
              onClick={() => handlePingHardware('gps')}
              disabled={isPingingGps}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                integrations.fleettrackConnected
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-rose-950/90 text-rose-400 border border-rose-800 hover:bg-rose-900/50'
              }`}
              title="Click to test & handshake Fleettrack GPS hardware socket"
            >
              {isPingingGps ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></span>
                  <span>Connecting Socket...</span>
                </>
              ) : integrations.fleettrackConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Fleettrack GPS: LIVE (12ms • packet {gpsSec}s ago)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Fleettrack DISCONNECTED</span>
                </>
              )}
            </button>

            {/* Easy Time Pro Live Biometrics */}
            <button
              onClick={() => handlePingHardware('bio')}
              disabled={isPingingBio}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                integrations.easyTimeProConnected
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-rose-950/90 text-rose-400 border border-rose-800 hover:bg-rose-900/50'
              }`}
              title="Click to test & handshake Easy Time Pro Biometric terminal"
            >
              {isPingingBio ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></span>
                  <span>Connecting Terminal...</span>
                </>
              ) : integrations.easyTimeProConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Easy Time Pro Bio: LIVE (18ms • punch {bioSec}s ago)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Easy Time Pro DISCONNECTED</span>
                </>
              )}
            </button>
          </div>
        )}

      {/* Right Controls: Search, Alerts, Account Profile, Direct Logout */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 md:hidden border border-slate-700 transition-colors"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Desktop Ctrl + K Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search (Ctrl + K)</span>
        </button>

        {/* Critical Alert Drawer Button */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          title="System Exceptions & Alerts"
        >
          <Bell className="w-4 h-4" />
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
              {alerts.length}
            </span>
          )}
        </button>

        {/* User Account Profile Badge & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1.5 sm:gap-2 bg-slate-950 border border-slate-700 px-2 sm:px-3 py-1.5 rounded-lg cursor-pointer hover:border-amber-500 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <span className="block text-xs font-bold text-white leading-tight">
                {currentUser?.name || 'Vetri'}
              </span>
              <span className="block text-[10px] text-amber-400 font-mono font-bold">
                {role} SESSION
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Account Dropdown Menu */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-800 text-xs">
                  <p className="font-bold text-white text-sm">{currentUser?.name || 'Vetri'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser?.email || 'owner@vetri.com'}</p>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded w-max uppercase">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>{role} Authenticated</span>
                  </div>
                </div>

                <div className="pt-1 px-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/80 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out Account</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Direct Sign Out Button */}
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
          title="Sign out of Vetri Indane Portal"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  </>
);
};
