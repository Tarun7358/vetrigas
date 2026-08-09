import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Flame, ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, LockKeyhole, KeyRound, ArrowLeft } from 'lucide-react';
import { API_BASE } from '../utils/api';

export const LoginPage: React.FC = () => {
  const { login } = useApp();

  // Mode: 'login' | 'forgot' | 'reset'
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check URL parameters for password reset link token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken');
    const emailParam = params.get('email');

    if (token) {
      setResetToken(token);
      if (emailParam) setEmail(emailParam);
      setMode('reset');
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(`Welcome back, ${data.user.name || 'User'}!`);
        setTimeout(() => {
          login(data.user.role, data.user.email, data.user.name, data.token);
        }, 400);
      } else {
        setErrorMsg(data.message || 'Invalid credentials. Please try again.');
      }
    } catch {
      setErrorMsg('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Password reset link sent! Check your inbox.');
      } else {
        setErrorMsg(data.message || 'Failed to send reset link.');
      }
    } catch {
      setErrorMsg('Unable to reach auth server. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setErrorMsg('Please enter your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          setMode('login');
          setPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMsg('You can now log in with your new password.');
          // Remove query params from URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Failed to reset password. Link may be expired.');
      }
    } catch {
      setErrorMsg('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden text-white font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm space-y-6 z-10">

        {/* Branding Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30">
            <Flame className="w-9 h-9 fill-slate-950 stroke-none" />
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-tight text-white">VETRI INDANE</h1>
            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mt-1">Enterprise LPG Operations Suite</p>
            <p className="text-[11px] text-slate-500 mt-1">Peelamedu, Coimbatore</p>
          </div>
        </div>

        {/* Login / Reset Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-5">

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <p className="text-sm font-bold text-white">
                {mode === 'login' ? 'Staff Portal Login' : mode === 'forgot' ? 'Reset Account Password' : 'Set New Password'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {mode === 'login'
                  ? 'Use your company credentials to sign in'
                  : mode === 'forgot'
                  ? 'We will send reset instructions to your email'
                  : 'Enter your new password below'}
              </p>
            </div>
            {mode === 'login' ? (
              <LockKeyhole className="w-5 h-5 text-amber-400/80 shrink-0" />
            ) : (
              <KeyRound className="w-5 h-5 text-amber-400/80 shrink-0" />
            )}
          </div>

          {/* Error / Success Messages */}
          {errorMsg && (
            <div className="bg-rose-950/90 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: Standard Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="name@vetriindane.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-400 font-bold uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="login-submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span>SIGNING IN...</span>
                ) : (
                  <>
                    <span>SIGN IN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: Forgot Password Form */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="owner@vetriindane.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'SENDING LINK...' : 'SEND RESET LINK TO EMAIL'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="w-full text-slate-400 hover:text-white font-semibold py-2 text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            </form>
          )}

          {/* MODE 3: Set New Password Form */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="At least 6 characters"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Re-enter new password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'SAVING...' : 'CONFIRM NEW PASSWORD'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="w-full text-slate-400 hover:text-white font-semibold py-2 text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            </form>
          )}

          {/* Footer note */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Account access is managed by the system <strong>Owner</strong>. Contact your admin if you cannot log in.</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3 h-3" /> Encrypted Auth
              </span>
              <span className="font-mono">v2.5.0 • RDK Technologies</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
