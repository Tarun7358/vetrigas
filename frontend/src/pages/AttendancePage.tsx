import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, ShieldCheck, CheckCircle2, Calendar, Filter } from 'lucide-react';
import { calculateProductivityReport } from '../utils/productivityAudit';

export const AttendancePage: React.FC = () => {
  const { attendance, role, currentUser, integrations, toggleIntegration } = useApp();
  const [roleFilter, setRoleFilter] = useState('ALL');

  const isManagement = role === 'OWNER' || role === 'MANAGER';

  // If management (OWNER/MANAGER), display all or role-filtered attendance
  // If field worker (DRIVER/LOADMAN), display ONLY their own attendance record
  const visibleAttendance = isManagement
    ? (roleFilter === 'ALL' ? attendance : attendance.filter(a => a.role.toUpperCase() === roleFilter))
    : attendance.filter(a => 
        a.employeeName.toLowerCase() === (currentUser?.name || '').toLowerCase()
      );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">
              {isManagement ? 'Biometric Attendance Registry' : `Personal Attendance Log (${currentUser?.name || 'Worker'})`}
            </h1>
            <p className="text-xs text-slate-400">
              {isManagement
                ? 'Enterprise Biometric Workforce Log Direct Sync via Easy Time Pro Integration'
                : `Verified Biometric Check-in & Punch Logs for ${currentUser?.name || 'Your Account'}`}
            </p>
          </div>
        </div>

        {/* Source Badge & Connection Toggle */}
        <div className="mt-3 md:mt-0 flex items-center gap-3">
          <span className="badge-status badge-blue flex items-center gap-1.5 py-1 px-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Biometric Engine: Easy Time Pro
          </span>
          {isManagement && (
            <button
              onClick={() => toggleIntegration('easyTimeProConnected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                integrations.easyTimeProConnected
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : 'bg-rose-950 text-rose-400 border border-rose-700'
              }`}
            >
              {integrations.easyTimeProConnected ? 'Status: ONLINE' : 'Status: NOT CONNECTED'}
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar for Management / Personal Notice for Workers */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm gap-3">
        {isManagement ? (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Filter Role:</span>
            {['ALL', 'DRIVER', 'LOADMAN'].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  roleFilter === r
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Showing verified attendance logs for <strong>{currentUser?.name}</strong></span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Calendar className="w-4 h-4 text-slate-400" /> Date: 08 August 2026
        </div>
      </div>

      {/* Attendance Table */}
      <div className="mobile-table-container bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="table-enterprise">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Shift vs Net Paid Hours</th>
              <th>Anti-Idle Audit</th>
              <th>Status</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {visibleAttendance.length > 0 ? (
              visibleAttendance.map(att => {
                const idleMins = att.role === 'Driver' ? 45 : 15;
                const audit = calculateProductivityReport(att.employeeId, att.employeeName, att.role, 9.0, 18, idleMins);

                return (
                  <tr key={att.id}>
                    <td>
                      <div className="font-bold text-slate-900">{att.employeeName}</div>
                      <div className="text-[11px] text-slate-500">{att.employeeId}</div>
                    </td>
                    <td>
                      <span
                        className={`badge-status ${
                          att.role === 'Driver' ? 'badge-blue' : 'badge-amber'
                        }`}
                      >
                        {att.role}
                      </span>
                    </td>
                    <td className="font-mono text-xs font-semibold text-slate-700">{att.checkIn}</td>
                    <td className="font-mono text-xs font-semibold text-slate-700">{att.checkOut}</td>
                    <td>
                      <div className="font-mono text-xs">
                        <span className="font-bold text-emerald-700">Net: {audit.netHoursFormatted}</span>
                        <span className="text-[10px] text-slate-400 block">Gross: {att.workingHours}</span>
                      </div>
                    </td>
                    <td>
                      {audit.unproductiveIdleMinutes > 0 ? (
                        <span className="badge-status badge-red text-[10px] font-mono font-bold">
                          -{audit.deductedHoursFormatted} Deducted ({audit.fuelWastedLiters}L Idle)
                        </span>
                      ) : (
                        <span className="badge-status badge-green text-[10px] font-mono font-bold">0m Idle</span>
                      )}
                    </td>
                    <td>
                      <span className="badge-status badge-green flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {att.status}
                      </span>
                    </td>
                    <td>
                      <span className="badge-status badge-blue flex items-center gap-1 font-bold text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Easy Time Pro
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400 text-xs italic">
                  No attendance records found for {currentUser?.name || 'your profile'}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
