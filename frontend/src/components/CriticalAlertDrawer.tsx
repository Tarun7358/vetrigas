import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, X, ArrowRight, ShieldAlert, Check } from 'lucide-react';

interface CriticalAlertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, targetId?: string) => void;
}

export const CriticalAlertDrawer: React.FC<CriticalAlertDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { alerts, dismissAlert } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-sm text-white">ATTENTION REQUIRED</h3>
            <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {alerts.length} ALERTS
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Check className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-300">All Operations Clear</p>
              <p className="text-xs mt-1">No pending warnings or cash mismatches.</p>
            </div>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-lg border text-xs transition-all ${
                  alert.type === 'CRITICAL'
                    ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                    : alert.type === 'WARNING'
                    ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                    : 'bg-blue-950/40 border-blue-800/80 text-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{alert.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{alert.message}</p>

                <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                    Module: {alert.module}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => {
                        if (alert.module === 'Billing') onNavigate('billing', alert.targetId);
                        else if (alert.module === 'Fleet') onNavigate('fleet', alert.targetId);
                        else if (alert.module === 'Loading') onNavigate('loading', alert.targetId);
                        else onNavigate('dashboard');
                        onClose();
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300"
                    >
                      View Record <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 text-center text-[10px] text-slate-500">
          Vetri Indane Operational Exception Router
        </div>
      </div>
    </div>
  );
};
