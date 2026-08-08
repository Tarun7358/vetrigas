import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">System Audit & Security Trail</h1>
            <p className="text-xs text-slate-400">
              Immutable System Activity & User Action Log
            </p>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="table-enterprise">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Module</th>
              <th>Record</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log.id}>
                <td className="font-mono text-xs text-slate-500">{log.timestamp}</td>
                <td className="font-bold text-slate-900">{log.user}</td>
                <td className="text-slate-800 font-semibold">{log.action}</td>
                <td>
                  <span className="badge-status badge-grey">{log.module}</span>
                </td>
                <td className="font-mono text-xs text-amber-700">{log.record}</td>
                <td>
                  <span
                    className={`badge-status ${
                      log.status === 'SUCCESS'
                        ? 'badge-green'
                        : log.status === 'WARNING'
                        ? 'badge-amber'
                        : 'badge-red'
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
