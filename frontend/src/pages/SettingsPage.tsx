import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { integrations, toggleIntegration } = useApp();

  const [agencyName, setAgencyName] = useState('Vetri Indane LPG Distributorship');
  const [sapCode, setSapCode] = useState('IN0039201');
  const [region, setRegion] = useState('Coimbatore South & Singanallur Circle, Tamil Nadu');
  const [backendUrl, setBackendUrl] = useState('http://localhost:5000');
  const [gpsPollInterval, setGpsPollInterval] = useState('4');
  const [enableGmailOtp, setEnableGmailOtp] = useState(true);
  const [autoApproveExpenses, setAutoApproveExpenses] = useState(false);

  const [testResult, setTestResult] = useState<{ status: 'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'; message: string }>({
    status: 'IDLE',
    message: '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTestDatabase = async () => {
    setTestResult({ status: 'TESTING', message: 'Connecting to local SQLite database server...' });
    try {
      const res = await fetch(`${backendUrl}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setTestResult({
          status: 'SUCCESS',
          message: `Connected successfully! Server: ${data.system} | Database: ${data.database}`,
        });
      } else {
        setTestResult({ status: 'ERROR', message: `Server responded with HTTP ${res.status}` });
      }
    } catch (err: any) {
      setTestResult({ status: 'ERROR', message: `Failed to connect: ${err.message || 'Server Offline'}` });
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
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
              Configure agency profile, SQLite database, telemetry webhooks, and security gates
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="badge-status badge-green flex items-center gap-2 text-xs py-1.5 px-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Settings Saved Successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Agency Information */}
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
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Indane SAP Distributorship Code</label>
              <input
                type="text"
                value={sapCode}
                onChange={e => setSapCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Territory / Zone</label>
              <input
                type="text"
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Database & Backend Engine */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between font-display font-bold text-slate-900 text-base mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              SQLite Database & Express API Engine
            </div>
            <span className="badge-status badge-blue text-[11px]">Local SQL Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Express API Backend URL</label>
              <input
                type="text"
                value={backendUrl}
                onChange={e => setBackendUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GPS Stream Polling Frequency (Seconds)</label>
              <select
                value={gpsPollInterval}
                onChange={e => setGpsPollInterval(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="2">2 Seconds (Ultra High Real-Time)</option>
                <option value="4">4 Seconds (Recommended Balanced)</option>
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
              Test SQLite Connection
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

        {/* Section 3: Telemetry & Hardware Integrations */}
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
                  checked={integrations.fleettrackConnected}
                  onChange={() => toggleIntegration('fleettrackConnected')}
                  className="w-4 h-4 text-amber-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500">Live SIM IMEI coordinate webhook listener</p>
              <div className="badge-status badge-gray text-[10px] font-mono">
                /integrations/fleettrack
              </div>
            </div>

            {/* EasyTime Pro Biometrics */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Easy Time Pro Biometrics</span>
                <input
                  type="checkbox"
                  checked={integrations.easyTimeProConnected}
                  onChange={() => toggleIntegration('easyTimeProConnected')}
                  className="w-4 h-4 text-amber-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500">Automated worker check-in fingerprint sync</p>
              <div className="badge-status badge-gray text-[10px] font-mono">
                /integrations/easytimepro
              </div>
            </div>

            {/* UPI Payment Gateway */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">UPI Payment Provider</span>
                <input
                  type="checkbox"
                  checked={integrations.paymentGatewayConnected}
                  onChange={() => toggleIntegration('paymentGatewayConnected')}
                  className="w-4 h-4 text-amber-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500">Instant digital QR collection confirmation</p>
              <div className="badge-status badge-gray text-[10px] font-mono">
                /integrations/payment
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Security Policies & Workflow Gates */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 font-display font-bold text-slate-900 text-base mb-4 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Security Gates & Role Control Rules
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <p className="font-bold text-slate-900">Enforce Gmail OTP Password Reset</p>
                <p className="text-slate-500 text-[11px]">Require 6-digit email code verification for forgotten password resets</p>
              </div>
              <input
                type="checkbox"
                checked={enableGmailOtp}
                onChange={e => setEnableGmailOtp(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <p className="font-bold text-slate-900">Auto-Approve Driver Expenses Under ₹500</p>
                <p className="text-slate-500 text-[11px]">Automatically approve low-value fuel and toll claims without manual Owner review</p>
              </div>
              <input
                type="checkbox"
                checked={autoApproveExpenses}
                onChange={e => setAutoApproveExpenses(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Platform Settings
          </button>
        </div>
      </form>
    </div>
  );
};
