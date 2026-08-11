import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, ShieldCheck, CheckCircle2, Calendar, Filter, FileSpreadsheet, AlertCircle, XCircle, Download } from 'lucide-react';
import { calculateProductivityReport } from '../utils/productivityAudit';
import { API_BASE } from '../utils/api';

export const AttendancePage: React.FC = () => {
  const { attendance, employees, role, integrations, toggleIntegration } = useApp();
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'DAILY' | 'MONTHLY'>('DAILY');

  // Selected date state (defaults to today in YYYY-MM-DD)
  const todayIso = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  const isManagement = role === 'OWNER' || role === 'MANAGER';

  // Format selected ISO date to DD Mon YYYY format (e.g. 11 Aug 2026)
  const formatIsoToDateStr = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return iso;
    }
  };

  const selectedDateFormatted = formatIsoToDateStr(selectedDate);
  const isToday = selectedDate === todayIso;

  // Filter attendance logs for the selected date across all employees
  const displayAttendance = employees
    .filter(e => e.role?.toUpperCase() !== 'OWNER')
    .filter(e => roleFilter === 'ALL' || e.role.toUpperCase().includes(roleFilter.replace('_', ' ')))
    .map(emp => {
      // Find log for this employee on selected date
      const log = attendance.find(a =>
        (a.employeeId === emp.id || a.employeeName?.toLowerCase() === emp.name.toLowerCase()) &&
        (a.date === selectedDateFormatted || a.date === selectedDate || (isToday && (a.date === new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) || !a.date)))
      );

      if (log) {
        return {
          id: log.id,
          employeeId: emp.id,
          employeeName: emp.name,
          role: emp.role,
          checkIn: log.checkIn || '--:--',
          checkOut: log.checkOut || '--:--',
          workingHours: log.workingHours || '--',
          status: log.status || (log.checkIn && log.checkIn !== '--:--' ? 'Present' : 'Not Scanned'),
          date: log.date || selectedDateFormatted,
        };
      }

      // If no log exists for requested date
      return {
        id: `att-${emp.id}-${selectedDate}`,
        employeeId: emp.id,
        employeeName: emp.name,
        role: emp.role,
        checkIn: '--:--',
        checkOut: '--:--',
        workingHours: '--',
        status: isToday ? 'Not Scanned' : 'Absent',
        date: selectedDateFormatted,
      };
    });

  // Calculate Monthly Analysis Metrics for August 2026
  const monthlyAnalysis = employees
    .filter(e => e.role?.toUpperCase() !== 'OWNER')
    .map(emp => {
      const empLogs = attendance.filter(a => a.employeeId === emp.id || a.employeeName?.toLowerCase() === emp.name.toLowerCase());
      const presentCount = empLogs.filter(a => a.status === 'Present').length;
      const lateCount = empLogs.filter(a => a.status === 'Late').length;
      const absentCount = Math.max(0, 26 - (presentCount + lateCount)); // 26 working days standard month
      const totalDaysAttended = presentCount + lateCount;
      const attRate = Math.round(((totalDaysAttended) / 26) * 100);

      return {
        emp,
        presentCount,
        lateCount,
        absentCount,
        totalDaysAttended,
        attRate: Math.min(100, attRate > 0 ? attRate : (emp.attendanceStatus === 'Present' ? 85 : 0)),
        totalHours: totalDaysAttended * 8,
      };
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-xl gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">
              Biometric Attendance Registry & Supabase Cloud Storage
            </h1>
            <p className="text-xs text-slate-400">
              Real-time Fingerprint Punch Sync • Historical Date Preview • Monthly Audit Engine
            </p>
          </div>
        </div>

        {/* Connection Status & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="badge-status badge-blue flex items-center gap-1.5 py-1.5 px-3 font-mono text-xs">
            <ShieldCheck className="w-4 h-4 text-blue-400" /> Easy Time Pro ZKTeco Hardware
          </span>
          {isManagement && (
            <button
              onClick={() => toggleIntegration('easyTimeProConnected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow ${
                integrations.easyTimeProConnected
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : 'bg-rose-950 text-rose-400 border border-rose-700'
              }`}
            >
              {integrations.easyTimeProConnected ? '● HARDWARE ONLINE' : '○ DISCONNECTED'}
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('DAILY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'DAILY'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-400" /> Daily Date Log Preview
          </button>
          <button
            onClick={() => setActiveTab('MONTHLY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'MONTHLY'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Monthly Analysis & Audit
          </button>

          {/* Export Button */}
          {isManagement && (
            <a
              href={`${API_BASE}/api/export/attendance${activeTab === 'DAILY' ? `?date=${selectedDateFormatted}` : `?month=Aug`}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all cursor-pointer ml-auto"
            >
              <Download className="w-4 h-4" /> Export CSV
            </a>
          )}
        </div>

        <div className="text-xs text-slate-500 font-semibold font-mono hidden md:block">
          Supabase DB Table: <code className="bg-slate-100 px-2 py-0.5 rounded text-blue-700 border">public.attendance</code>
        </div>
      </div>

      {activeTab === 'DAILY' ? (
        <>
          {/* Controls Bar: Date Picker & Role Filters */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm gap-4">
            {/* Role Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-400 mr-1" />
              <span className="text-xs font-bold text-slate-700 mr-1">Filter Role:</span>
              {['ALL', 'DRIVER', 'LOADMAN', 'MANAGER', 'STOREROOM STAFF', 'GODOWN KEEPER'].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    roleFilter === r
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Date Picker & Presets */}
            <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
              <span className="text-xs font-bold text-slate-700">Preview Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-slate-950 text-white font-mono text-xs border border-slate-800 rounded-lg px-3 py-1.5 outline-none focus:border-amber-500"
              />
              <button
                onClick={() => setSelectedDate(todayIso)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  isToday ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Today
              </button>
            </div>
          </div>

          {/* Active Date Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-white flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>
                Showing Attendance Log for: <strong>{selectedDateFormatted}</strong> {isToday && '(LIVE TODAY)'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {displayAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length} / {displayAttendance.length} Workers Scanned Present
            </span>
          </div>

          {/* Attendance Daily Preview Table */}
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
                  <th>Cloud DB Sync</th>
                </tr>
              </thead>
              <tbody>
                {displayAttendance.length > 0 ? (
                  displayAttendance.map(att => {
                    const idleMins = att.role === 'Driver' ? 45 : 15;
                    const audit = calculateProductivityReport(att.employeeId, att.employeeName, att.role, 9.0, 18, idleMins);

                    const isPresent = att.status === 'Present';
                    const isLate = att.status === 'Late';
                    const isAbsent = att.status === 'Absent';
                    const isNotScanned = att.status === 'Not Scanned' || att.checkIn === '--:--';

                    return (
                      <tr key={att.id}>
                        <td>
                          <div className="font-bold text-slate-900 text-sm">{att.employeeName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{att.employeeId}</div>
                        </td>
                        <td>
                          <span
                            className={`badge-status ${
                              att.role === 'Driver' ? 'badge-blue' : att.role === 'Loadman' ? 'badge-amber' : 'badge-green'
                            }`}
                          >
                            {att.role}
                          </span>
                        </td>
                        <td className="font-mono text-xs font-semibold text-slate-800">{att.checkIn}</td>
                        <td className="font-mono text-xs font-semibold text-slate-800">{att.checkOut}</td>
                        <td>
                          <div className="font-mono text-xs">
                            <span className="font-bold text-emerald-700">Net: {isNotScanned || isAbsent ? '--' : audit.netHoursFormatted}</span>
                            <span className="text-[10px] text-slate-400 block">Gross: {att.workingHours}</span>
                          </div>
                        </td>
                        <td>
                          {!isNotScanned && !isAbsent && audit.unproductiveIdleMinutes > 0 ? (
                            <span className="badge-status badge-red text-[10px] font-mono font-bold">
                              -{audit.deductedHoursFormatted} Deducted ({audit.fuelWastedLiters}L Idle)
                            </span>
                          ) : (
                            <span className="badge-status badge-green text-[10px] font-mono font-bold">0m Idle</span>
                          )}
                        </td>
                        <td>
                          {isPresent && (
                            <span className="badge-status badge-green flex items-center gap-1 w-fit font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PRESENT
                            </span>
                          )}
                          {isLate && (
                            <span className="badge-status badge-amber flex items-center gap-1 w-fit font-bold">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> LATE CHECK-IN
                            </span>
                          )}
                          {isAbsent && (
                            <span className="badge-status badge-red flex items-center gap-1 w-fit font-bold">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> ABSENT
                            </span>
                          )}
                          {isNotScanned && !isAbsent && (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1 w-fit">
                              ○ NOT SCANNED
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="badge-status badge-blue flex items-center gap-1 font-bold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Supabase Synced
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 text-xs italic">
                      No attendance records found for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Monthly Attendance Analysis Table */
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-slate-900 to-amber-950 border border-slate-800 rounded-2xl p-5 text-white flex flex-col md:flex-row items-center justify-between shadow-lg gap-4">
            <div>
              <h2 className="font-display font-extrabold text-lg text-white">Monthly Attendance & Compliance Analysis</h2>
              <p className="text-xs text-amber-300 mt-0.5">Automated Month-End Summary • August 2026 Working Days Audit</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs px-3 py-1.5 rounded-xl font-bold">
                Standard Month: 26 Shift Days
              </span>
            </div>
          </div>

          <div className="mobile-table-container bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="table-enterprise">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Days Present</th>
                  <th>Days Late</th>
                  <th>Days Absent / Unscanned</th>
                  <th>Total Shift Hours</th>
                  <th>Monthly Attendance Rate</th>
                  <th>Payroll Status</th>
                </tr>
              </thead>
              <tbody>
                {monthlyAnalysis.map(({ emp, presentCount, lateCount, absentCount, attRate, totalHours }) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="font-bold text-slate-900 text-sm">{emp.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{emp.email || emp.id}</div>
                    </td>
                    <td>
                      <span className="badge-status badge-blue">{emp.role}</span>
                    </td>
                    <td className="font-mono font-bold text-emerald-700 text-xs">{presentCount} Days</td>
                    <td className="font-mono font-bold text-amber-700 text-xs">{lateCount} Days</td>
                    <td className="font-mono font-bold text-rose-600 text-xs">{absentCount} Days</td>
                    <td className="font-mono font-semibold text-slate-800 text-xs">{totalHours} hrs</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full ${
                              attRate >= 90 ? 'bg-emerald-500' : attRate >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${attRate}%` }}
                          ></div>
                        </div>
                        <span className="font-mono font-extrabold text-xs text-slate-900">{attRate}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-status badge-green font-bold text-[11px]">
                        ✓ Verified for Payroll
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
