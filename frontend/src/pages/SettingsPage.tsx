import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { API_BASE } from '../utils/api';
import {
  Settings,
  Database,
  ShieldCheck,
  Building,
  Radio,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HardDrive,
  QrCode,
  Smartphone,
  Lock,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { integrations, toggleIntegration, role } = useApp();

  const isOwner = role === 'OWNER' || role === 'MANAGER' || role === 'STOREROOM_STAFF';

  // Load persisted settings or use defaults
  const [agencyName, setAgencyName] = useState(() => {
    return localStorage.getItem('vetri_setting_agency') || 'Vetri Indane LPG Distributorship';
  });
  const [sapCode, setSapCode] = useState(() => {
    return localStorage.getItem('vetri_setting_sap') || 'IN0039201';
  });
  const [region, setRegion] = useState(() => {
    return localStorage.getItem('vetri_setting_region') || 'Peelamedu, Coimbatore South, Tamil Nadu';
  });
  const [gpayPhone, setGpayPhone] = useState(() => {
    return localStorage.getItem('vetri_setting_gpay_phone') || '+91 96008 70814';
  });
  const [gpayUpiId, setGpayUpiId] = useState(() => {
    return localStorage.getItem('vetri_setting_gpay_vpa') || '9600870814@upi';
  });
  const [backendUrl, setBackendUrl] = useState(() => {
    return localStorage.getItem('vetri_setting_backend') || API_BASE;
  });
  const [gpsPollInterval, setGpsPollInterval] = useState('2');
  const [enableGmailOtp, setEnableGmailOtp] = useState(true);
  const [autoApproveExpenses, setAutoApproveExpenses] = useState(false);

  const [testResult, setTestResult] = useState<{ status: 'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'; message: string }>({
    status: 'IDLE',
    message: '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTestDatabase = async () => {
    setTestResult({ status: 'TESTING', message: 'Connecting to Express API and SQLite backend...' });
    try {
      const res = await fetch(`${backendUrl}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setTestResult({
          status: 'SUCCESS',
          message: `Connected successfully! System: ${data.system || 'Vetri Express'} | DB: ${data.database || 'SQLite Production'}`,
        });
      } else {
        setTestResult({ status: 'ERROR', message: `Server returned status HTTP ${res.status}` });
      }
    } catch (err: any) {
      setTestResult({ status: 'ERROR', message: `Unable to connect: ${err.message || 'Server Offline'}` });
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    try {
      localStorage.setItem('vetri_setting_agency', agencyName);
      localStorage.setItem('vetri_setting_sap', sapCode);
      localStorage.setItem('vetri_setting_region', region);
      localStorage.setItem('vetri_setting_gpay_phone', gpayPhone);
      localStorage.setItem('vetri_setting_gpay_vpa', gpayUpiId);
      localStorage.setItem('vetri_setting_backend', backendUrl);
    } catch (e) {
      console.warn('LocalStorage save error');
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
              Platform & Integration Settings
            </h1>
            <p className="text-xs text-slate-400">
              Configure agency profile, Google Pay UPI receiver, SQLite backend engine, telemetry, and security gates
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="badge-status badge-green flex items-center gap-2 text-xs py-1.5 px-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Settings Saved Successfully!
          </div>
        )}
      </div>

      {!isOwner && (
        <div className="bg-amber-950/70 border border-amber-800 text-amber-200 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Notice: Platform settings are in read-only mode for your role ({role}). Contact the System Owner to modify core agency configurations.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Agency Profile */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 font-display font-bold text-slate-900 text-base mb-4 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-amber-500" />
            Agency Profile & Identification
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Agency Name</label>
              <input
                type="text"
                disabled={!isOwner}
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Indane SAP Distributorship Code</label>
              <input
                type="text"
                disabled={!isOwner}
                value={sapCode}
                onChange={e => setSapCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Territory / Zone</label>
              <input
                type="text"
                disabled={!isOwner}
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Google Pay & Digital Payment Gateway Config */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between font-display font-bold text-slate-900 text-base pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              Google Pay & Live UPI Payment Collection Settings
            </div>
            <span className="badge-status badge-green text-[11px]">GPay Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Agency Helpline & GPay Mobile</label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  disabled={!isOwner}
                  value={gpayPhone}
                  onChange={e => setGpayPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-60"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Number registered for Google Pay credit transfers</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary UPI VPA ID</label>
              <input
                type="text"
                disabled={!isOwner}
                value={gpayUpiId}
                onChange={e => setGpayUpiId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-60"
              />
              <p className="text-[10px] text-slate-500 mt-1">Used to format dynamic QR codes on driver bills</p>
            </div>

            {/* Live QR Preview */}
            <div className="p-3 bg-slate-900 rounded-xl text-white flex items-center gap-3 border border-slate-800">
              <div className="bg-white p-1 rounded-lg shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                    `upi://pay?pa=${gpayUpiId}&pn=VETRI%20INDANE%20LPG&cu=INR`
                  )}`}
                  alt="Dynamic GPay QR"
                  className="w-14 h-14"
                />
              </div>
              <div className="text-[11px] space-y-0.5">
                <p className="font-bold text-amber-400 uppercase">Live QR Preview</p>
                <p className="font-mono text-slate-200">{gpayUpiId}</p>
                <p className="text-[10px] text-slate-400">{gpayPhone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Database & Backend Engine */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between font-display font-bold text-slate-900 text-base mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              SQLite Database & Express API Engine
            </div>
            <span className="badge-status badge-blue text-[11px]">Express + SQLite Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Express API Backend URL</label>
              <input
                type="text"
                disabled={!isOwner}
                value={backendUrl}
                onChange={e => setBackendUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GPS Stream Polling Frequency</label>
              <select
                disabled={!isOwner}
                value={gpsPollInterval}
                onChange={e => setGpsPollInterval(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60"
              >
                <option value="2">2 Seconds (Ultra High Real-Time)</option>
                <option value="4">4 Seconds (Balanced)</option>
                <option value="10">10 Seconds (Power Saving)</option>
              </select>
            </div>
          </div>

          {/* Database Diagnostics */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span>Database Path: <strong className="font-mono text-slate-800">database/vetri_indane.db</strong></span>
            </div>

            <button
              type="button"
              onClick={handleTestDatabase}
              disabled={testResult.status === 'TESTING'}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
            >
              {testResult.status === 'TESTING' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Database className="w-3.5 h-3.5 text-blue-400" />
              )}
              Test Backend Connection
            </button>
          </div>

          {/* Connection Test Output */}
          {testResult.status !== 'IDLE' && (
            <div className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${
              testResult.status === 'SUCCESS' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' :
              testResult.status === 'ERROR' ? 'bg-rose-50 border border-rose-200 text-rose-800' :
              'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              {testResult.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {testResult.status === 'ERROR' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              {testResult.status === 'TESTING' && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Section 4: Hardware & Gateway Integrations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 font-display font-bold text-slate-900 text-base mb-4 pb-3 border-b border-slate-100">
            <Radio className="w-5 h-5 text-emerald-600" />
            Hardware & Gateway Telemetry Integrations
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fleettrack GPS */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Fleettrack EH21 GPS</span>
                <input
                  type="checkbox"
                  disabled={!isOwner}
                  checked={integrations.fleettrackConnected}
                  onChange={() => toggleIntegration('fleettrackConnected')}
                  className="w-4 h-4 text-amber-500 rounded cursor-pointer disabled:opacity-60"
                />
              </div>
              <p className="text-[11px] text-slate-500">Live SIM IMEI coordinate webhook listener</p>
              <div className="badge-status badge-gray text-[10px] font-mono">
                /api/gps/vehicles
              </div>
            </div>

            {/* EasyTime Pro Biometrics */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Easy Time Pro Biometrics</span>
                <input
                  type="checkbox"
                  disabled={!isOwner}
                  checked={integrations.easyTimeProConnected}
                  onChange={() => toggleIntegration('easyTimeProConnected')}
                  className="w-4 h-4 text-amber-500 rounded cursor-pointer disabled:opacity-60"
                />
              </div>
              <p className="text-[11px] text-slate-500">Automated worker check-in fingerprint sync</p>
              <div className="badge-status badge-gray text-[10px] font-mono">
                /api/attendance
              </div>
            </div>

            {/* UPI Payment Gateway */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">UPI Payment Provider</span>
                <input
                  type="checkbox"
                  disabled={!isOwner}
                  checked={integrations.paymentGatewayConnected}
                  onChange={() => toggleIntegration('paymentGatewayConnected')}
                  className="w-4 h-4 text-amber-500 rounded cursor-pointer disabled:opacity-60"
                />
              </div>
              <p className="text-[11px] text-slate-500">Instant digital QR collection confirmation</p>
              <div className="badge-status badge-gray text-[10px] font-mono">
                /api/bills
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Security Policies & Workflow Gates */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 font-display font-bold text-slate-900 text-base mb-4 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Security Gates & Role Control Rules
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <p className="font-bold text-slate-900">Enforce Gmail OTP Password Reset</p>
                <p className="text-slate-500 text-[11px]">Require single-use JWT link verification sent via SMTP for forgotten password resets</p>
              </div>
              <input
                type="checkbox"
                disabled={!isOwner}
                checked={enableGmailOtp}
                onChange={e => setEnableGmailOtp(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded cursor-pointer disabled:opacity-60"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <p className="font-bold text-slate-900">Auto-Approve Driver Expenses Under ₹500</p>
                <p className="text-slate-500 text-[11px]">Automatically approve low-value fuel and toll claims without manual Owner review</p>
              </div>
              <input
                type="checkbox"
                disabled={!isOwner}
                checked={autoApproveExpenses}
                onChange={e => setAutoApproveExpenses(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded cursor-pointer disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Save Action Button */}
        {isOwner && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Platform Settings
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
