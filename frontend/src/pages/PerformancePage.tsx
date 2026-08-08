import React from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp } from 'lucide-react';

export const PerformancePage: React.FC = () => {
  const { employees } = useApp();

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
          {employees.map(emp => (
            <div key={emp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-sm">{emp.name}</p>
                <p className="text-xs text-slate-500">{emp.role} • {emp.todayWorkProgress} Completed</p>
              </div>
              <div className="text-right">
                <span className="font-display font-bold text-lg text-emerald-600 font-mono">{emp.performanceScore} / 100</span>
                <p className="text-[11px] text-slate-500">Overall Rating</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
