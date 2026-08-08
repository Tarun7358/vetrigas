import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';
import {
  Flame,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Briefcase,
  Truck,
  PackageCheck,
  Crown,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>('OWNER');
  const [email, setEmail] = useState('owner@vetri.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const rolePresets: Record<
    UserRole,
    { email: string; title: string; subtitle: string; icon: React.ElementType; badgeColor: string }
  > = {
    OWNER: {
      email: 'owner@vetri.com',
      title: 'Owner Portal (Vetri)',
      subtitle: 'Full System Control, Worker Management & Financial Approvals',
      icon: Crown,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    },
    MANAGER: {
      email: 'manager@vetri.com',
      title: 'Operations Manager',
      subtitle: 'Fleet Live Tracking, Batch Dispatch & Delivery Control',
      icon: Briefcase,
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    },
    DRIVER: {
      email: 'arun@vetri.com',
      title: 'Driver Portal (Arun)',
      subtitle: 'Assigned Routes, Customer Payments & E-Bill Receipting',
      icon: Truck,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    },
    LOADMAN: {
      email: 'kumar@vetri.com',
      title: 'Loadman Portal (Kumar)',
      subtitle: 'Cylinder Depot Loading & Discrepancy Audits',
      icon: PackageCheck,
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    },
  };

  const handleRoleSelect = (r: UserRole) => {
    setSelectedRole(r);
    setEmail(rolePresets[r].email);
    setPassword('admin123');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter valid corporate email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Connect to Express Backend API on port 5000 (with local fallback)
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: selectedRole }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('[AUTH SUCCESS] Authenticated via Express API:', data);
        login(selectedRole, email, password);
      } else {
        // Fallback login for offline/standalone mode
        login(selectedRole, email, password);
      }
    } catch (err) {
      console.log('[AUTH NOTE] Backend offline or CORS fallback. Logging in with client state.');
      login(selectedRole, email, password);
    } finally {
      setLoading(false);
    }
  };

  const ActiveIcon = rolePresets[selectedRole].icon;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden text-white font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 z-10">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30">
            <Flame className="w-10 h-10 fill-slate-950 stroke-none" />
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
            VETRI INDANE
          </h1>
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            Enterprise LPG Operations Suite
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Engineered by RDK Technologies</p>
        </div>

        {/* Quick Role Selection Tab Bar */}
        <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl grid grid-cols-4 gap-1 text-[11px] font-bold">
          {(['OWNER', 'MANAGER', 'DRIVER', 'LOADMAN'] as UserRole[]).map(r => {
            const isSelected = selectedRole === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleSelect(r)}
                className={`py-2 rounded-lg transition-all flex flex-col items-center gap-1 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{r}</span>
              </button>
            );
          })}
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <ActiveIcon className="w-4 h-4" />
              <span>{rolePresets[selectedRole].title}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {rolePresets[selectedRole].subtitle}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">
                Corporate Email / Identifier
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="name@vetri.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-[11px]">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>Remember session</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Please contact Vetri Indane System Admin or RDK Support to reset password.')}
                className="text-amber-400 hover:underline font-semibold"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>AUTHENTICATING...</span>
              ) : (
                <>
                  <span>SECURE ACCESS PORTAL</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit Encrypted
            </span>
            <span className="font-mono text-slate-400">v2.4.0 • RDK</span>
          </div>
        </div>
      </div>
    </div>
  );
};

