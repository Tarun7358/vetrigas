import React from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp } from 'lucide-react';

export const PerformancePage: React.FC = () => {
  const { employees, deliveries } = useApp();
  const workerEmployees = employees.filter(e => (e.role || '').toLowerCase() !== 'owner');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-600/40">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">Workforce Performance Analytics</h1>
            <p className="text-xs text-slate-400">
              Operational Metric Overview (Attendance Rate, Speed, Payment Accuracy)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-display font-bold text-base text-slate-900">Performance Summary Matrix</h2>
        <div className="space-y-3">
          {workerEmployees.map(emp => {
            const roleNorm = (emp.role || '').toLowerCase();
            const isOwner = roleNorm.includes('owner');
            
            // Dynamic task and performance calculation
            let assignedCount = 0;
            let completedCount = 0;
            let progressLabel = '';
            let score = 95;

            if (isOwner) {
              progressLabel = '100% Completed';
              score = 100;
            } else if (roleNorm.includes('driver')) {
              const driverDels = deliveries.filter(d => (d.driverName || '').toLowerCase() === emp.name.toLowerCase());
              assignedCount = driverDels.length;
              completedCount = driverDels.filter(d => d.status === 'DELIVERED').length;
              if (assignedCount > 0) {
                const pct = Math.round((completedCount / assignedCount) * 100);
                progressLabel = `${completedCount}/${assignedCount} Completed (${pct}%)`;
                score = Math.round(85 + (completedCount / assignedCount) * 15);
              } else {
                progressLabel = '0/0 Completed (Shift Ready)';
                score = 95;
              }
            } else {
              // Loadman, Manager, Godown Keeper, Storeroom Staff
              assignedCount = deliveries.length;
              completedCount = deliveries.filter(d => d.status === 'DELIVERED').length;
              if (assignedCount > 0) {
                const pct = Math.round((completedCount / assignedCount) * 100);
                progressLabel = `${completedCount}/${assignedCount} Completed (${pct}%)`;
                score = Math.round(85 + (completedCount / assignedCount) * 15);
              } else {
                progressLabel = '0/0 Completed (Shift Ready)';
                score = 95;
              }
            }

            return (
              <div key={emp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{emp.name}</p>
                  <p className="text-xs text-slate-500">{emp.role} • {progressLabel}</p>
                </div>
                <div className="text-right">
                  <span className="font-display font-bold text-lg text-emerald-600 font-mono">{score} / 100</span>
                  <p className="text-[11px] text-slate-500">Overall Rating</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
